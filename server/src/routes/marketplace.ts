import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { collectibles, itemArchetypes } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function marketplaceRoutes(app: FastifyInstance) {
  // Sync on-chain ownership update when an item is bought
  app.post("/api/marketplace/sync-buy", async (req, reply) => {
    const { tokenId, buyerAddress, txHash } = req.body as {
      tokenId: number;
      buyerAddress: string;
      txHash?: string;
    };

    if (!tokenId || !buyerAddress) {
      return reply.status(400).send({ error: "tokenId and buyerAddress are required" });
    }

    const cleanBuyer = buyerAddress.toLowerCase();

    // Update owner in database
    await db
      .update(collectibles)
      .set({
        ownerAddress: cleanBuyer,
        txHash: txHash || undefined,
      })
      .where(eq(collectibles.tokenId, tokenId));

    return { success: true, tokenId, newOwner: cleanBuyer };
  });

  // Get collectible details by tokenId for marketplace display
  app.get("/api/marketplace/collectible/:tokenId", async (req, reply) => {
    const { tokenId } = req.params as { tokenId: string };
    const numId = parseInt(tokenId, 10);
    if (isNaN(numId)) {
      return reply.status(400).send({ error: "Invalid tokenId" });
    }

    const item = await db.query.collectibles.findFirst({
      where: eq(collectibles.tokenId, numId),
    });

    if (!item) {
      return reply.status(404).send({ error: "Collectible not found" });
    }

    const archetype = await db.query.itemArchetypes.findFirst({
      where: eq(itemArchetypes.id, item.archetypeId),
    });

    return {
      ...item,
      archetype,
    };
  });
}
