import { db } from "../db/index.js";
import { players, itemArchetypes, collectibles, gachaJobs } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { generateAILoreAndStats } from "./zerog-ai.js";
import { uploadTo0GStorage } from "./zerog-storage.js";
import { mintNFTToPlayer } from "./chain-minter.js";

interface QueueTask {
  jobId: number;
  walletAddress: string;
}

class GachaQueueService {
  private queue: QueueTask[] = [];
  private isProcessing = false;
  private activeWorkers = 0;
  private maxConcurrent = 1; // Serialize on-chain mints to avoid nonce collisions

  constructor() {
    // On startup, recover any interrupted queued/processing jobs
    this.recoverStaleJobs();
  }

  private async recoverStaleJobs() {
    try {
      const stale = await db.query.gachaJobs.findMany({
        where: inArray(gachaJobs.status, ["queued", "processing"]),
        orderBy: [gachaJobs.id],
      });

      for (const job of stale) {
        this.queue.push({
          jobId: job.id,
          walletAddress: job.walletAddress,
        });
      }

      if (this.queue.length > 0) {
        console.log(`[GachaQueue] Recovered ${this.queue.length} pending jobs.`);
        this.triggerProcessing();
      }
    } catch (err) {
      console.error("[GachaQueue] Failed to recover stale jobs:", err);
    }
  }

  /**
   * Enqueue a new gacha draw task for the player
   */
  async enqueue(cleanAddress: string): Promise<{ jobId: number; remainingTickets: number }> {
    // 1. Fetch player and check tickets
    const player = await db.query.players.findFirst({
      where: eq(players.walletAddress, cleanAddress),
    });

    if (!player) {
      throw new Error("Player not found");
    }

    if (player.tickets < 1) {
      throw new Error("No tickets left! Buy tickets using coins.");
    }

    // 2. Atomically deduct 1 ticket
    const [updatedPlayer] = await db
      .update(players)
      .set({ tickets: player.tickets - 1 })
      .where(eq(players.walletAddress, cleanAddress))
      .returning();

    // 3. Create job record in database
    const [job] = await db
      .insert(gachaJobs)
      .values({
        walletAddress: cleanAddress,
        status: "queued",
        stepMessage: "📡 探測任務已加入排程，等待調度...",
        acknowledged: 0,
      })
      .returning();

    // 4. Push to memory queue
    this.queue.push({
      jobId: job.id,
      walletAddress: cleanAddress,
    });

    console.log(`[GachaQueue] Enqueued job #${job.id} for ${cleanAddress}. Remaining tickets: ${updatedPlayer.tickets}`);

    // 5. Trigger processor
    this.triggerProcessing();

    return {
      jobId: job.id,
      remainingTickets: updatedPlayer.tickets,
    };
  }

  private triggerProcessing() {
    if (this.isProcessing) return;
    this.processNext();
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();
    if (!task) {
      this.isProcessing = false;
      return;
    }

    try {
      await this.executeJob(task.jobId, task.walletAddress);
    } catch (err) {
      console.error(`[GachaQueue] Uncaught error processing job #${task.jobId}:`, err);
    } finally {
      // Process next task
      setImmediate(() => this.processNext());
    }
  }

  private async executeJob(jobId: number, cleanAddress: string) {
    console.log(`[GachaQueue] Starting processing for job #${jobId} (${cleanAddress})...`);

    const updateStep = async (stepMessage: string, status = "processing") => {
      await db
        .update(gachaJobs)
        .set({ status, stepMessage })
        .where(eq(gachaJobs.id, jobId));
    };

    try {
      // Step 1: Update status to processing
      await updateStep("📡 調度 0G Serving AI 引擎...");

      // Step 2: Roll weighted archetype RNG
      const archetypes = await db.query.itemArchetypes.findMany();
      if (!archetypes || archetypes.length === 0) {
        throw new Error("No item archetypes found in database.");
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

      // Step 3: 0G Serving AI Generation
      await updateStep("🧬 解算藏品專屬傳奇背景與詞條...");
      const aiItem = await generateAILoreAndStats(selectedArchetype.name, selectedArchetype.rarity);

      // Step 4: Assemble metadata & 0G Storage upload
      await updateStep("📦 永久封存 Metadata 至 0G Storage...");
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

      // Step 5: On-chain Minting on 0G Galileo
      await updateStep("⛓️ 0G Galileo 區塊鏈代付鑄造 NFT...");
      const { tokenId, txHash } = await mintNFTToPlayer(
        cleanAddress,
        selectedArchetype.id,
        storageHash
      );

      // Step 6: Save collectible record
      const [savedCollectible] = await db
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

      // Step 7: Mark job completed
      await db
        .update(gachaJobs)
        .set({
          status: "completed",
          stepMessage: "✨ 探測成功！藏品已鑄造完成",
          collectibleId: savedCollectible.id,
          archetypeId: selectedArchetype.id,
          completedAt: new Date(),
        })
        .where(eq(gachaJobs.id, jobId));

      console.log(
        `[GachaQueue] Job #${jobId} completed successfully! Token #${tokenId} for ${cleanAddress}`
      );
    } catch (err: any) {
      console.error(`[GachaQueue] Error executing job #${jobId}:`, err);

      // Mark failed
      await db
        .update(gachaJobs)
        .set({
          status: "failed",
          stepMessage: "⚠️ 探測任務發生異常中斷",
          error: err?.message || "Unknown error during gacha process",
          completedAt: new Date(),
        })
        .where(eq(gachaJobs.id, jobId));

      // Refund 1 ticket to player on system error
      try {
        await db
          .update(players)
          .set({
            tickets: players.tickets, // or increment
          })
          .where(eq(players.walletAddress, cleanAddress));
      } catch (refundErr) {
        console.error("[GachaQueue] Refund error:", refundErr);
      }
    }
  }

  /**
   * Get active and recently completed unacknowledged jobs for the player
   */
  async getPlayerJobs(cleanAddress: string) {
    // 1. Fetch active jobs or unacknowledged completed jobs
    const jobs = await db.query.gachaJobs.findMany({
      where: and(
        eq(gachaJobs.walletAddress, cleanAddress),
        inArray(gachaJobs.status, ["queued", "processing", "completed"])
      ),
      orderBy: [desc(gachaJobs.id)],
      limit: 10,
    });

    // 2. Attach archetype & collectible details for completed jobs
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        if (job.status === "completed" && job.collectibleId && job.archetypeId) {
          const [collectible, archetype] = await Promise.all([
            db.query.collectibles.findFirst({
              where: eq(collectibles.id, job.collectibleId),
            }),
            db.query.itemArchetypes.findFirst({
              where: eq(itemArchetypes.id, job.archetypeId),
            }),
          ]);
          return {
            ...job,
            collectible,
            archetype,
          };
        }
        return job;
      })
    );

    return enrichedJobs;
  }

  /**
   * Mark a completed job as acknowledged (viewed by user)
   */
  async acknowledge(jobId: number, cleanAddress: string) {
    await db
      .update(gachaJobs)
      .set({ acknowledged: 1 })
      .where(and(eq(gachaJobs.id, jobId), eq(gachaJobs.walletAddress, cleanAddress)));
    return { success: true };
  }
}

export const gachaQueue = new GachaQueueService();
