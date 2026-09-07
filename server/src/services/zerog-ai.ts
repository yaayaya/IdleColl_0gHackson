export interface AIGeneratedItem {
  title: string;
  lore: string;
  personality: string;
  stats: {
    luck: number;
    miningBonus: string;
    rarityScore: number;
    specialTrait: string;
  };
}

const PREFIXES = [
  "過載超頻的", "遺落在事件視界的", "被反物質浸潤的", "裝載神經義肢的",
  "流亡星際海盜的", "0G共識驗證過的", "第4維度投影的", "奈米機械寄生的",
  "永不熄滅的", "極地低溫超導的", "深空暗物質染色的", "全息霓虹偽裝的"
];

const TRAITS = [
  "曲率引擎核心共振", "深空引力波透鏡", "0G Storage 永久防腐",
  "量子糾纏保鮮", "電磁脈衝超載", "反重力懸浮校準",
  "賽博神經連結", "光子吸收屏障", "星圖躍遷導航"
];

const LORES = [
  "在柯伊伯帶的小行星拆船廠被尋獲，內部結構被未知外星智慧改造過。",
  "曾隨同第一代星際開拓者墜入木星大紅斑，經歷了十萬個大氣壓的淬煉依然完好。",
  "表面刻有微型 0G 節點共識符號，每逢恆星日食便會發出低沉的脈衝信號。",
  "由一位退役的深空賞金獵人隨身佩戴，據說曾多次抵擋過高能伽馬射線暴。",
  "從廢棄的軌道太空站氣閘艙中漂流而出，至今仍散發著微弱的放射性光暈。"
];

export async function generateAILoreAndStats(archetypeName: string, rarity: string): Promise<AIGeneratedItem> {
  const apiKey = process.env.ZEROG_AI_API_KEY;
  const endpoint = process.env.ZEROG_AI_ENDPOINT || "https://serving.0g.ai/v1";

  // If live 0G Serving API is configured, attempt real inference
  if (apiKey) {
    try {
      const model = process.env.ZEROG_AI_MODEL || "qwen/qwen-2.5-7b-instruct";
      console.log(`[0G AI] Requesting real 0G Compute inference at ${endpoint} (model: ${model})...`);
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a sci-fi space salvage archaeologist AI. Generate a unique variant of a space collectible item. Output strictly valid JSON with keys: title (string), lore (string, 1-2 sentences), personality (string), stats (object with luck: number 1-100, miningBonus: string like +15%, rarityScore: number 50-100, specialTrait: string)."
            },
            {
              role: "user",
              content: `Create a unique ${rarity} variant for archetype: ${archetypeName}`
            }
          ],
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          console.log(`[0G AI] Successfully received 0G decentralized AI generation: "${parsed.title}"`);
          return parsed as AIGeneratedItem;
        }
      } else {
        const errText = await response.text();
        console.warn(`[0G AI] 0G Compute response status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn("[0G AI] 0G Serving API call failed or timed out, falling back to resilient procedural generator:", err);
    }
  }

  // Resilient fallback generator (100% stable for hackathon demo)
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const serialNo = Math.floor(Math.random() * 900) + 100;
  const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
  const lore = LORES[Math.floor(Math.random() * LORES.length)];

  let baseBonus = 5;
  let baseLuck = 50;
  if (rarity === "Rare") { baseBonus = 12; baseLuck = 65; }
  else if (rarity === "Epic") { baseBonus = 20; baseLuck = 80; }
  else if (rarity === "Legendary") { baseBonus = 35; baseLuck = 95; }

  const luck = Math.min(100, baseLuck + Math.floor(Math.random() * 15));
  const bonus = baseBonus + Math.floor(Math.random() * 8);

  return {
    title: `${prefix}${archetypeName} #${serialNo}`,
    lore: `${archetypeName}的罕見變體。${lore}`,
    personality: Math.random() > 0.5 ? "高頻躁動 / 渴望能量" : "沉穩自律 / 抗干擾",
    stats: {
      luck,
      miningBonus: `+${bonus}%`,
      rarityScore: luck,
      specialTrait: trait,
    },
  };
}
