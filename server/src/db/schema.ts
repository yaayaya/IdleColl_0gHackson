import { pgTable, text, integer, timestamp, jsonb, serial } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  walletAddress: text("wallet_address").primaryKey(),
  name: text("name").notNull().default("Captain"),
  coins: integer("coins").notNull().default(500),
  tickets: integer("tickets").notNull().default(3),
  lastClaimAt: timestamp("last_claim_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const itemArchetypes = pgTable("item_archetypes", {
  id: integer("id").primaryKey(), // 1 ~ 12
  name: text("name").notNull(),
  rarity: text("rarity").notNull(), // Common, Rare, Epic, Legendary
  description: text("description").notNull(),
  baseImage: text("base_image").notNull(),
  dropWeight: integer("drop_weight").notNull().default(10),
});

export const collectibles = pgTable("collectibles", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id"),
  ownerAddress: text("owner_address").notNull().references(() => players.walletAddress),
  archetypeId: integer("archetype_id").notNull().references(() => itemArchetypes.id),
  aiTitle: text("ai_title").notNull(),
  aiLore: text("ai_lore").notNull(),
  aiStats: jsonb("ai_stats").notNull(),
  storageHash: text("storage_hash").notNull(),
  txHash: text("tx_hash"),
  mintStatus: text("mint_status").notNull().default("minted"), // pending, minted, failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gachaJobs = pgTable("gacha_jobs", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().references(() => players.walletAddress),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  stepMessage: text("step_message").notNull().default("探測信號發射中..."),
  collectibleId: integer("collectible_id"),
  archetypeId: integer("archetype_id"),
  error: text("error"),
  acknowledged: integer("acknowledged").notNull().default(0), // 0: unviewed, 1: viewed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

