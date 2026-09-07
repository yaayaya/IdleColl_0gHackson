import { pool, db } from "./index.js";
import { itemArchetypes } from "./schema.js";
import { seed } from "./seed.js";

export async function initDb() {
  console.log("Checking and initializing PostgreSQL schema...");

  // Create tables if they do not exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      wallet_address text PRIMARY KEY,
      name text NOT NULL DEFAULT 'Captain',
      coins integer NOT NULL DEFAULT 500,
      tickets integer NOT NULL DEFAULT 3,
      last_claim_at timestamp with time zone NOT NULL DEFAULT now(),
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS item_archetypes (
      id integer PRIMARY KEY,
      name text NOT NULL,
      rarity text NOT NULL,
      description text NOT NULL,
      base_image text NOT NULL,
      drop_weight integer NOT NULL DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS collectibles (
      id serial PRIMARY KEY,
      token_id integer,
      owner_address text NOT NULL REFERENCES players(wallet_address),
      archetype_id integer NOT NULL REFERENCES item_archetypes(id),
      ai_title text NOT NULL,
      ai_lore text NOT NULL,
      ai_stats jsonb NOT NULL,
      storage_hash text NOT NULL,
      tx_hash text,
      mint_status text NOT NULL DEFAULT 'minted',
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);

  console.log("PostgreSQL schema verified.");

  // Check and seed 12 archetypes if empty
  try {
    const existing = await db.query.itemArchetypes.findMany();
    if (existing.length === 0) {
      console.log("Archetypes table is empty. Seeding 12 items...");
      await seed();
    } else {
      console.log(`Database already has ${existing.length} archetypes.`);
    }
  } catch (err) {
    console.warn("Notice during archetype check/seed:", err);
  }
}
