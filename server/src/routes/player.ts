import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { players, collectibles } from "../db/schema.js";
import { eq } from "drizzle-orm";

const BASE_COINS_PER_SECOND = 10;
const BASE_MAX_IDLE_COINS = 1000;
const MAX_OFFLINE_HOURS = 24;

async function calculateFleetBonuses(walletAddress: string) {
  const items = await db.query.collectibles.findMany({
    where: eq(collectibles.ownerAddress, walletAddress.toLowerCase()),
  });

  let totalMiningBonusValue = 0;
  let totalCapacityBonus = 0;
  let totalLuck = 0;
  const activeBuffs: { title: string; trait: string; bonusText: string }[] = [];

  for (const item of items) {
    const stats = (item.aiStats || {}) as any;
    // mining bonus
    const mbVal =
      Number(stats.miningBonusValue) ||
      (stats.miningBonus ? parseFloat(String(stats.miningBonus).replace(/[^0-9.]/g, "")) / 10 : 0) ||
      1.0;
    totalMiningBonusValue += mbVal;

    // capacity bonus
    const capVal = Number(stats.capacityBonus) || 150;
    totalCapacityBonus += capVal;

    // luck
    const luckVal = Number(stats.luck) || 50;
    totalLuck += luckVal;

    if (stats.specialTrait) {
      activeBuffs.push({
        title: item.aiTitle,
        trait: stats.specialTrait,
        bonusText: stats.traitDescription || `+${mbVal.toFixed(1)} 幣/秒，+${capVal} 儲能上限`,
      });
    }
  }

  const effectiveMiningRate = parseFloat((BASE_COINS_PER_SECOND + totalMiningBonusValue).toFixed(1));
  const effectiveMaxIdleCoins = BASE_MAX_IDLE_COINS + totalCapacityBonus;
  const fleetLuck = items.length > 0 ? Math.round(totalLuck / items.length) : 50;

  return {
    itemsCount: items.length,
    baseRate: BASE_COINS_PER_SECOND,
    bonusRate: parseFloat(totalMiningBonusValue.toFixed(1)),
    effectiveMiningRate,
    baseCapacity: BASE_MAX_IDLE_COINS,
    bonusCapacity: totalCapacityBonus,
    effectiveMaxIdleCoins,
    fleetLuck,
    activeBuffs: activeBuffs.slice(0, 5),
  };
}

export async function playerRoutes(app: FastifyInstance) {
  // Get or initialize player profile with dynamic fleet bonuses
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

    const fleet = await calculateFleetBonuses(cleanAddress);

    // Calculate pending idle coins with dynamic capacity and dynamic rate
    const now = Date.now();
    const lastClaim = new Date(player!.lastClaimAt).getTime();
    const elapsedSeconds = Math.min(
      Math.max(0, Math.floor((now - lastClaim) / 1000)),
      MAX_OFFLINE_HOURS * 3600
    );
    const rawPending = Math.floor(elapsedSeconds * fleet.effectiveMiningRate);
    const pendingCoins = Math.min(rawPending, fleet.effectiveMaxIdleCoins);

    return {
      player,
      miningRate: fleet.effectiveMiningRate,
      baseMiningRate: fleet.baseRate,
      bonusMiningRate: fleet.bonusRate,
      pendingCoins,
      maxIdleCoins: fleet.effectiveMaxIdleCoins,
      baseCapacity: fleet.baseCapacity,
      bonusCapacity: fleet.bonusCapacity,
      fleetLuck: fleet.fleetLuck,
      fleetItemsCount: fleet.itemsCount,
      activeBuffs: fleet.activeBuffs,
      elapsedSeconds,
    };
  });

  // Claim idle coins with dynamic fleet stats and luck critical chance
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

    const fleet = await calculateFleetBonuses(cleanAddress);

    const now = Date.now();
    const lastClaim = new Date(player.lastClaimAt).getTime();
    const elapsedSeconds = Math.min(
      Math.max(0, Math.floor((now - lastClaim) / 1000)),
      MAX_OFFLINE_HOURS * 3600
    );
    const rawEarned = Math.floor(elapsedSeconds * fleet.effectiveMiningRate);
    let earnedCoins = Math.min(rawEarned, fleet.effectiveMaxIdleCoins);

    if (earnedCoins <= 0) {
      return { player, claimed: 0, isCrit: false };
    }

    // Critical harvest check based on fleet luck (up to 30% chance for 2x payout)
    const critChance = Math.min(0.35, (fleet.fleetLuck / 100) * 0.25);
    const isCrit = Math.random() < critChance;
    if (isCrit) {
      earnedCoins = earnedCoins * 2;
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
      isCrit,
      miningRate: fleet.effectiveMiningRate,
      maxIdleCoins: fleet.effectiveMaxIdleCoins,
      player: {
        ...player,
        coins: newCoins,
        lastClaimAt: newLastClaim,
      },
    };
  });

  // Update player custom nickname
  app.post("/api/player/nickname", async (req, reply) => {
    const { address, name } = req.body as { address?: string; name?: string };
    if (!address || !name) {
      return reply.status(400).send({ error: "Address and name are required" });
    }

    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 24) {
      return reply.status(400).send({ error: "暱稱長度需在 1 到 24 個字元之間" });
    }

    const cleanAddress = address.toLowerCase();
    const [updated] = await db
      .update(players)
      .set({ name: trimmed })
      .where(eq(players.walletAddress, cleanAddress))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Player not found" });
    }

    return {
      success: true,
      player: updated,
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
