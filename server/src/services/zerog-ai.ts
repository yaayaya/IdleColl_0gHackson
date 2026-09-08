export interface AIGeneratedItem {
  title: string;
  lore: string;
  personality: string;
  stats: {
    luck: number;
    miningBonus: string;
    miningBonusValue: number;
    capacityBonus: number;
    rarityScore: number;
    specialTrait: string;
    traitDescription: string;
  };
}

const FALLBACK_TRAITS = [
  { name: "曲率核心共振", desc: "引發反應爐高能共振，提升艦隊整體產能與反應靈敏度" },
  { name: "深空引力透鏡", desc: "折射宇宙背景微波，使金幣儲存池容量大幅擴充" },
  { name: "0G 存儲拓撲防腐", desc: "利用去中心化存儲錨定數據態，強化金幣採集穩定性" },
  { name: "量子態坍縮冷卻", desc: "瞬間冷卻過載反應爐，提供持續且平穩的額外產出" },
  { name: "電磁脈衝超頻", desc: "微型電磁脈衝釋放，帶來瞬間高額金幣加成" },
  { name: "反重力懸浮校準", desc: "抵消微重力震顫，減少能量耗散並擴增儲能空間" },
  { name: "賽博神經超空間連結", desc: "提升艦長意念感知，顯著增加收取時的幸運共鳴爆擊率" },
  { name: "光子能量吸收屏障", desc: "汲取深空恆星殘餘光子，全時段補充採礦反應爐" },
  { name: "星圖折躍定向導航", desc: "定位隱藏富礦帶，大幅增加高能金幣凝結速度" },
  { name: "事件視界能量虹吸", desc: "汲取黑洞邊緣霍金輻射，提供極罕見的傳奇級巨額產能" },
  { name: "奈米自我修復網", desc: "反應爐腔體自動維護，延長高效率運轉並擴大儲量" },
  { name: "超空間暗物質引流", desc: "引入純淨暗物質流，直接翻倍局部儲能上限" }
];

const FALLBACK_LORES = [
  "在柯伊伯帶廢棄的拆船廠被尋獲，內部結構曾被未知的第三類外星智慧深度改造，依然散發微弱幽藍螢光。",
  "曾隨同第一代星際開拓艦隊墜入木星大紅斑，歷經十萬個大氣壓的極端淬煉，表面銘刻著殘存的 0G 節點拓撲共識。",
  "由一位退役的深空賞金獵人貼身佩戴，曾在數次伽馬射線暴中庇護了整艘巡航艦的副反應爐。",
  "從廢棄的第 7 軌道太空站氣閘艙中漂流而出，當鄰近恆星進入耀斑期時，其晶體核心便會發出低沉而和諧的脈衝共振。",
  "在船底座旋臂的一顆冰凍死星地底被鑽探出土，其超導結構在絕對零度下仍維持著不滅的量子糾纏態。",
  "原屬於仙女座走私艦隊的機密核心組件，經歷了多次超空間跳躍折射，具備難以捉摸的空間延展特性。",
  "這枚遺物曾記錄了某位失蹤深空製圖師最後的日誌，其合金外殼對任何外部能量擾動都展現出驚人的吸收率。",
  "自獵戶座暗星雲的超新星遺跡中打撈而出，內部凝固著高密度的重元素，能直接扭曲周遭的微觀引力常數。"
];

export async function generateAILoreAndStats(archetypeName: string, rarity: string): Promise<AIGeneratedItem> {
  const apiKey = process.env.ZEROG_AI_API_KEY;
  const endpoint = process.env.ZEROG_AI_ENDPOINT || "https://compute-network-6.integratenetwork.work/v1/proxy";
  const model = process.env.ZEROG_AI_MODEL || "qwen/qwen2.5-omni-7b";

  let baseBonus = 1.0;
  let baseBonusStr = "+10%";
  let baseCapacity = 150;
  let baseLuck = 50;

  if (rarity === "Rare") {
    baseBonus = 2.0;
    baseBonusStr = "+20%";
    baseCapacity = 350;
    baseLuck = 68;
  } else if (rarity === "Epic") {
    baseBonus = 3.5;
    baseBonusStr = "+35%";
    baseCapacity = 650;
    baseLuck = 82;
  } else if (rarity === "Legendary") {
    baseBonus = 6.0;
    baseBonusStr = "+60%";
    baseCapacity = 1200;
    baseLuck = 94;
  }

  // If live 0G Serving API is configured, attempt real inference
  if (apiKey) {
    try {
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
              content: `你是一位深空星際考古學家與 0G 智能遺物解算專家。
請根據給定的道具原型與稀有度，解算出一件絕無僅有、具有濃厚硬派科幻感的 0G 星際藏品。
必須全部使用「繁體中文」輸出，且必須嚴格輸出合法的 JSON，不可包含 markdown 標籤之外的任何非 JSON 文字。

輸出格式規格：
{
  "title": "「星雲低語」量子曲率核心",
  "lore": "這具核心被發現於獵戶座懸臂的廢棄科研觀測站，其內部仍封存著未解的超空間引力波漣漪。每當鄰近恆星耀斑爆發時，外殼的 0G 拓撲晶格便會散發微弱幽藍光芒。",
  "personality": "深邃沉靜，偶爾在超空間躍遷時產生低頻電磁共鳴",
  "stats": {
    "luck": 88,
    "miningBonus": "+25%",
    "miningBonusValue": 2.5,
    "capacityBonus": 400,
    "rarityScore": 92,
    "specialTrait": "引力透鏡共振",
    "traitDescription": "產生超維度引力場，實時提升採礦速率 +2.5 幣/秒並擴充儲存池 400 金幣上限"
  }
}

要求：
1. title: 必須極具科幻藝術感且獨特（例如「『永恆熵增』反物質引擎」、「普朗克裂隙探測稜鏡」），嚴禁千篇一律的前綴！
2. lore: 2-3 句具備星際歷史由來與奇異現象的繁體中文故事。
3. stats 中的數值需符合此物品的稀有度基準。`
            },
            {
              role: "user",
              content: `請為以下原型生成獨一無二的 ${rarity} 級星際藏品：原型名稱【${archetypeName}】，稀有度【${rarity}】。基準加成參考：產率加成約 ${baseBonusStr} (數值約 ${baseBonus})，容量擴充約 +${baseCapacity}，幸運值約 ${baseLuck}。`
            }
          ],
          temperature: 0.85,
          max_tokens: 450,
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const cleanJson = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.title && parsed.lore && parsed.stats) {
            // Normalize stats to ensure consistent numeric properties
            parsed.stats.luck = Number(parsed.stats.luck) || baseLuck;
            parsed.stats.miningBonus = parsed.stats.miningBonus || baseBonusStr;
            parsed.stats.miningBonusValue = Number(parsed.stats.miningBonusValue) || baseBonus;
            parsed.stats.capacityBonus = Number(parsed.stats.capacityBonus) || baseCapacity;
            parsed.stats.rarityScore = Number(parsed.stats.rarityScore) || parsed.stats.luck;
            parsed.stats.specialTrait = parsed.stats.specialTrait || "星際共振";
            parsed.stats.traitDescription = parsed.stats.traitDescription || `提供 ${parsed.stats.miningBonus} 產幣增幅與 +${parsed.stats.capacityBonus} 儲能擴充`;

            console.log(`[0G AI] Successfully received 0G decentralized AI generation: "${parsed.title}"`);
            return parsed as AIGeneratedItem;
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[0G AI] 0G Compute response status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn("[0G AI] 0G Serving API call failed or timed out, falling back to rich procedural generator:", err);
    }
  }

  // Resilient rich procedural generator (100% stable fallback)
  const traitObj = FALLBACK_TRAITS[Math.floor(Math.random() * FALLBACK_TRAITS.length)];
  const loreText = FALLBACK_LORES[Math.floor(Math.random() * FALLBACK_LORES.length)];
  const serialNo = Math.floor(Math.random() * 9000) + 1000;

  const adjectives = ["超維度", "遺落在事件視界的", "極地低溫超導", "被反物質浸潤的", "第4維度投影", "高頻震盪", "普朗克尺度", "0G共識驗證"];
  const selectedAdj = adjectives[Math.floor(Math.random() * adjectives.length)];

  const luckRoll = Math.min(99, baseLuck + Math.floor(Math.random() * 8) - 3);
  const bonusVal = parseFloat((baseBonus + (Math.random() * 0.8 - 0.4)).toFixed(1));
  const capBonus = baseCapacity + Math.floor(Math.random() * 100) - 50;

  return {
    title: `「${selectedAdj}」${archetypeName} #${serialNo}`,
    lore: `出土於深空遠征採集任務。${loreText}`,
    personality: Math.random() > 0.5 ? "高頻躁動，渴求更多反應爐能量反饋" : "沉穩自律，可精確過濾深空背景輻射干擾",
    stats: {
      luck: luckRoll,
      miningBonus: `+${Math.round(bonusVal * 10)}%`,
      miningBonusValue: bonusVal,
      capacityBonus: capBonus,
      rarityScore: luckRoll,
      specialTrait: traitObj.name,
      traitDescription: `${traitObj.desc}（產幣 +${bonusVal}/秒，儲能 +${capBonus} 金幣）`,
    },
  };
}

