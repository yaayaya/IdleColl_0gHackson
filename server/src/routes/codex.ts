import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { itemArchetypes, collectibles } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export async function codexRoutes(app: FastifyInstance) {
  app.get("/api/codex", async (req, reply) => {
    const { address } = req.query as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "Address is required" });
    }

    const cleanAddress = address.toLowerCase();

    // 1. Fetch all archetypes
    const allArchetypes = await db.query.itemArchetypes.findMany({
      orderBy: (items, { asc }) => [asc(items.id)],
    });

    // 2. Fetch player's owned collectibles
    const playerItems = await db.query.collectibles.findMany({
      where: eq(collectibles.ownerAddress, cleanAddress),
      orderBy: [desc(collectibles.createdAt)],
    });

    // 3. Map into 12 codex slots
    const slots = allArchetypes.map((archetype) => {
      const variants = playerItems.filter((item) => item.archetypeId === archetype.id);
      return {
        archetype,
        isUnlocked: variants.length > 0,
        count: variants.length,
        variants,
      };
    });

    const unlockedCount = slots.filter((s) => s.isUnlocked).length;
    const totalSlots = allArchetypes.length;
    const percent = Math.round((unlockedCount / (totalSlots || 1)) * 100);

    return {
      unlockedCount,
      totalSlots,
      percent,
      slots,
    };
  });
}
