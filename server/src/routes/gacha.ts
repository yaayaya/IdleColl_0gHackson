import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { players, itemArchetypes, collectibles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateAILoreAndStats } from "../services/zerog-ai.js";
import { uploadTo0GStorage } from "../services/zerog-storage.js";
import { mintNFTToPlayer } from "../services/chain-minter.js";
import { gachaQueue } from "../services/gacha-queue.js";

export async function gachaRoutes(app: FastifyInstance) {
  /**
   * Non-blocking gacha draw queue:
   * Deducts 1 ticket atomically, creates job in DB, and returns instantly (< 30ms).
   */
  app.post("/api/gacha/queue", async (req, reply) => {
    const { address } = req.body as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "Address is required" });
    }

    const cleanAddress = address.toLowerCase();

    try {
      const result = await gachaQueue.enqueue(cleanAddress);
      return {
        success: true,
        jobId: result.jobId,
        remainingTickets: result.remainingTickets,
        message: "探測任務已加入排程",
      };
    } catch (err: any) {
      return reply.status(400).send({
        error: err?.message || "Failed to enqueue gacha task",
      });
    }
  });

  /**
   * Get active and recently completed jobs for the player
   */
  app.get("/api/gacha/jobs", async (req, reply) => {
    const { address } = req.query as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "Address query parameter is required" });
    }

    const cleanAddress = address.toLowerCase();
    const jobs = await gachaQueue.getPlayerJobs(cleanAddress);
    return { jobs };
  });

  /**
   * Acknowledge completed job (so it is not repeatedly shown to the user)
   */
  app.post("/api/gacha/ack", async (req, reply) => {
    const { address, jobId } = req.body as { address?: string; jobId?: number };
    if (!address || !jobId) {
      return reply.status(400).send({ error: "Address and jobId are required" });
    }

    const cleanAddress = address.toLowerCase();
    await gachaQueue.acknowledge(jobId, cleanAddress);
    return { success: true };
  });

  /**
   * Legacy synchronous draw endpoint (fallback)
   */
  app.post("/api/gacha/draw", async (req, reply) => {
    const { address } = req.body as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "Address is required" });
    }

    const cleanAddress = address.toLowerCase();
    const player = await db.query.players.findFirst({
      where: eq(players.walletAddress, cleanAddress),
    });

    if (!player) {
      return reply.status(404).send({ error: "Player not found" });
    }

    if (player.tickets < 1) {
      return reply.status(400).send({ error: "No tickets left! Buy tickets using coins." });
    }

    // 1. Deduct 1 ticket
    await db
      .update(players)
      .set({ tickets: player.tickets - 1 })
      .where(eq(players.walletAddress, cleanAddress));

    // 2. Fetch all 12 archetypes and roll weighted RNG
    const archetypes = await db.query.itemArchetypes.findMany();
    if (!archetypes || archetypes.length === 0) {
      return reply.status(500).send({ error: "No archetypes found in database. Please seed." });
    }

    const totalWeight = archetypes.reduce((acc, item) => acc + item.dropWeight, 0);
    let randomWeight = Math.floor(Math.random() * totalWeight);
    let selectedArchetype = archetypes[0];

    for (const item of archetypes) {
      if (randomWeight < item.dropWeight) {
        selectedArchetype = item;
        break;
      }
      randomWeight -= item.dropWeight;
    }

    // 3. Generate unique AI Lore, Personality & Stats using 0G Serving
    const aiItem = await generateAILoreAndStats(selectedArchetype.name, selectedArchetype.rarity);

    // 4. Assemble ERC-721 Metadata and upload to 0G Storage
    const metadata = {
      name: aiItem.title,
      description: aiItem.lore,
      image: selectedArchetype.baseImage,
      archetypeId: selectedArchetype.id,
      attributes: [
        { trait_type: "Archetype", value: selectedArchetype.name },
        { trait_type: "Rarity", value: selectedArchetype.rarity },
        { trait_type: "Special Trait", value: aiItem.stats.specialTrait },
        { trait_type: "Mining Bonus", value: aiItem.stats.miningBonus },
        { trait_type: "Luck", value: aiItem.stats.luck },
      ],
      zerog_provenance: {
        personality: aiItem.personality,
        network: "0G Galileo Testnet (16602)",
        storage_provider: "0G Storage",
        timestamp: Date.now(),
      },
    };

    const { storageHash } = await uploadTo0GStorage(metadata);

    // 5. Mint to 0G Chain directly to player address
    const { tokenId, txHash } = await mintNFTToPlayer(cleanAddress, selectedArchetype.id, storageHash);

    // 6. Save collectible to database
    const [saved] = await db
      .insert(collectibles)
      .values({
        tokenId,
        ownerAddress: cleanAddress,
        archetypeId: selectedArchetype.id,
        aiTitle: aiItem.title,
        aiLore: aiItem.lore,
        aiStats: aiItem.stats,
        storageHash,
        txHash,
        mintStatus: "minted",
      })
      .returning();

    return {
      success: true,
      archetype: selectedArchetype,
      collectible: saved,
      remainingTickets: player.tickets - 1,
    };
  });
}
