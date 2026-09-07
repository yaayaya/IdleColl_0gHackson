import { db, pool } from "./index.js";
import { itemArchetypes } from "./schema.js";

const ARCHETYPES = [
  {
    id: 1,
    name: "過期太空泡麵",
    rarity: "Common",
    description: "2088年生產的紅燒牛肉風味，在真空環境下奇蹟般沒有變質，微波後依然飄香。",
    baseImage: "/items/01_ramen.svg",
    dropWeight: 40,
  },
  {
    id: 2,
    name: "月球突變兔",
    rarity: "Rare",
    description: "長年生活在月球阿波羅環形山背面，耳尖會發出幽微的藍色螢光，極速跳躍。",
    baseImage: "/items/02_rabbit.svg",
    dropWeight: 25,
  },
  {
    id: 3,
    name: "火星耐旱盆栽",
    rarity: "Rare",
    description: "由第一批火星殖民者留下的基因改良多肉植物，只要吸收宇宙射線就能生長。",
    baseImage: "/items/03_plant.svg",
    dropWeight: 20,
  },
  {
    id: 4,
    name: "故障採礦無人機",
    rarity: "Common",
    description: "失去了導航模組，但鑽頭依然以每分鐘 8000 轉高速旋轉，是拆船工人最愛。",
    baseImage: "/items/04_drone.svg",
    dropWeight: 35,
  },
  {
    id: 5,
    name: "鈦金屬太空馬桶",
    rarity: "Common",
    description: "配備零重力強壓氣旋抽風系統，即使在超空間躍遷時也能安心如廁。",
    baseImage: "/items/05_toilet.svg",
    dropWeight: 30,
  },
  {
    id: 6,
    name: "木衛二低溫冰晶",
    rarity: "Epic",
    description: "採集自木衛二歐羅巴深海冰層，核心封存著一滴未知的史前微生物原液。",
    baseImage: "/items/06_ice.svg",
    dropWeight: 15,
  },
  {
    id: 7,
    name: "賽博復古 Walkman",
    rarity: "Epic",
    description: "卡式錄音帶仍在旋轉，循環播放著 1980 年代的 Synthwave 電音與深空雜訊。",
    baseImage: "/items/07_walkman.svg",
    dropWeight: 12,
  },
  {
    id: 8,
    name: "零重力黑洞咖啡杯",
    rarity: "Epic",
    description: "杯底內嵌微型人造引力環，劇烈搖晃也不會灑出一滴濃縮咖啡。",
    baseImage: "/items/08_coffee.svg",
    dropWeight: 10,
  },
  {
    id: 9,
    name: "外星人遺落的拖鞋",
    rarity: "Common",
    description: "三指專用人體工學拖鞋，採用反重力記憶泡棉，穿上後走路完全沒有聲音。",
    baseImage: "/items/09_slipper.svg",
    dropWeight: 25,
  },
  {
    id: 10,
    name: "戴森球能量碎塊",
    rarity: "Legendary",
    description: "從坍塌的恆星聚能環掉落的高密度結晶，表面持續向外釋放太陽耀斑般的輝光。",
    baseImage: "/items/10_dyson.svg",
    dropWeight: 5,
  },
  {
    id: 11,
    name: "薛丁格量子貓罐頭",
    rarity: "Legendary",
    description: "在打開拉環之前，裡面的金槍魚肉同時處於極致美味與已經發霉的疊加態。",
    baseImage: "/items/11_catfood.svg",
    dropWeight: 4,
  },
  {
    id: 12,
    name: "0G 創世原始晶片",
    rarity: "Legendary",
    description: "刻有 0G 去中心化共識核心演算法的金色晶片，星際文明據傳由它啟動。",
    baseImage: "/items/12_chip.svg",
    dropWeight: 2,
  },
];

export async function seed() {
  console.log("Seeding 12 base item archetypes...");
  for (const item of ARCHETYPES) {
    await db
      .insert(itemArchetypes)
      .values(item)
      .onConflictDoUpdate({
        target: itemArchetypes.id,
        set: item,
      });
  }
  console.log("Successfully seeded 12 archetypes!");
  await pool.end();
}

if (process.argv[1]?.includes("seed.ts")) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
