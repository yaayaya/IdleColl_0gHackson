import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { players } from "../db/schema.js";
import { eq } from "drizzle-orm";

const COINS_PER_SECOND = 2; // 2 coins per second = 10 coins / 5s
const MAX_OFFLINE_HOURS = 24;

export async function playerRoutes(app: FastifyInstance) {
  // Get or initialize player profile
  app.get("/api/player/profile", async (req, reply) => {
    const { address } = req.query as { address?: string };
    if (!address) {
      return reply.status(400).send({ error: "Address query parameter is required" });
    }

    const cleanAddress = address.toLowerCase();
    let player = await db.query.players.findFirst({
      where: eq(players.walletAddress, cleanAddress),
    });

    if (!player) {
      const newPlayer = {
        walletAddress: cleanAddress,
        name: `Captain_${cleanAddress.slice(2, 6)}`,
        coins: 500,
        tickets: 3,
        lastClaimAt: new Date(),
      };
      await db.insert(players).values(newPlayer);
      player = newPlayer as any;
    }

    // Calculate pending idle coins
    const now = Date.now();
    const lastClaim = new Date(player!.lastClaimAt).getTime();
    const elapsedSeconds = Math.min(
      Math.max(0, Math.floor((now - lastClaim) / 1000)),
      MAX_OFFLINE_HOURS * 3600
    );
    const pendingCoins = elapsedSeconds * COINS_PER_SECOND;

    return {
      player,
      miningRate: COINS_PER_SECOND,
      pendingCoins,
      elapsedSeconds,
    };
  });

  // Claim idle coins
  app.post("/api/player/claim", async (req, reply) => {
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

    const now = Date.now();
    const lastClaim = new Date(player.lastClaimAt).getTime();
    const elapsedSeconds = Math.min(
      Math.max(0, Math.floor((now - lastClaim) / 1000)),
      MAX_OFFLINE_HOURS * 3600
    );
    const earnedCoins = elapsedSeconds * COINS_PER_SECOND;

    if (earnedCoins <= 0) {
      return { player, claimed: 0 };
    }

    const newCoins = player.coins + earnedCoins;
    const newLastClaim = new Date(now);

    await db
      .update(players)
      .set({
        coins: newCoins,
        lastClaimAt: newLastClaim,
      })
      .where(eq(players.walletAddress, cleanAddress));

    return {
      claimed: earnedCoins,
      player: {
        ...player,
        coins: newCoins,
        lastClaimAt: newLastClaim,
      },
    };
  });

  // Buy gacha ticket with coins
  app.post("/api/player/buy-ticket", async (req, reply) => {
    const { address, count = 1 } = req.body as { address?: string; count?: number };
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

    const ticketPrice = 500;
    const totalCost = count * ticketPrice;

    if (player.coins < totalCost) {
      return reply.status(400).send({ error: `Not enough coins. Need ${totalCost} coins.` });
    }

    const updatedCoins = player.coins - totalCost;
    const updatedTickets = player.tickets + count;

    await db
      .update(players)
      .set({
        coins: updatedCoins,
        tickets: updatedTickets,
      })
      .where(eq(players.walletAddress, cleanAddress));

    return {
      cost: totalCost,
      player: {
        ...player,
        coins: updatedCoins,
        tickets: updatedTickets,
      },
    };
  });
}
