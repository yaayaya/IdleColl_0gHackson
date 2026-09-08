export interface AIGeneratedItem {
  title: string;
  lore: string;
  personality: string;
  sector?: string;
  anomaly?: string;
  quantumHash?: string;
  stats: {
    luck: number;
    miningBonus: string;
    miningBonusValue: number;
    capacityBonus: number;
    rarityScore: number;
    specialTrait: string;
    traitDescription: string;
    sector?: string;
    anomaly?: string;
  };
}

const COSMIC_SECTORS = [
  "柯伊伯帶第 42 號廢棄小行星礦坑",
  "半人馬座黑洞邊緣吸積盤",
  "仙女座引力透鏡第 7 躍遷走廊",
  "船底座星雲超新星遺跡第 9 扇區",
  "獵戶座暗星雲冰凍死星地底",
  "天鵝座 X-1 雙星系強磁場殘骸帶",
  "室女座超星系團邊緣廢棄太空站",
  "英仙座外緣失落走私艦隊墓場",
  "舊地球同步軌道第 13 號垃圾掩埋帶",
  "海山二高能伽馬射線暴焦點遺跡",
  "盾牌座 UY 超巨星近日軌道觀測站",
  "蛇夫座低溫分子雲原始吸積盤",
  "銀河系銀心第 3 號人造戴森環廢墟",
  "大麥哲倫星系邊界暗物質風暴區",
  "武仙-北冕座長城未知古文明碎石帶"
];

const COSMIC_ANOMALIES = [
  "絕對零度極致深凍、殘留超光速引力波漣漪",
  "高能霍金輻射淬煉、微型事件視界潮汐撕裂",
  "強電磁脈衝風暴沖刷、外殼呈現彩虹狀反引力燒蝕痕跡",
  "反物質洩漏微環境、表面包裹未知硅基結晶共生體",
  "超維度拓撲幾何折疊、時間流速呈現非線性擾動",
  "高密度中子星塵埃沉積、原子核級別超導晶格重組",
  "恆星耀斑高溫等離子體洗禮、金屬記憶合金自我重構",
  "微黑洞潮汐力拉伸、內部結構呈現非對稱量子坍縮",
  "宇宙射線暴高頻聚焦、引發微弱的自主意識電路脈衝",
  "普朗克尺度空間泡沫沸騰、具備局域微重力懸浮特性",
  "外星真菌孢子超空間休眠體附著、散發幽綠自發光冷焰",
  "強重力透鏡光子滯留、光線在物體表面形成閉環迴旋"
];

const COSMIC_GENRES = [
  "硬核天體物理奇觀",
  "幽默荒誕的深空異聞",
  "賽博龐克生物機械異化",
  "遠古失落文明星際考古",
  "超空間維度異化與奇點探索"
];

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

  // Dynamic Cosmic Exploration Entropy (Prevents repetitive LLM outputs)
  const sector = COSMIC_SECTORS[Math.floor(Math.random() * COSMIC_SECTORS.length)];
  const anomaly = COSMIC_ANOMALIES[Math.floor(Math.random() * COSMIC_ANOMALIES.length)];
  const genre = COSMIC_GENRES[Math.floor(Math.random() * COSMIC_GENRES.length)];
  const quantumHash = "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");

  // If live 0G Serving API is configured, attempt real inference
  if (apiKey) {
    try {
      console.log(`[0G AI] Requesting real 0G Compute inference at ${endpoint} (model: ${model})...`);
      const dynamicTemp = parseFloat((0.92 + Math.random() * 0.06).toFixed(2));
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
              content: `你是一位受雇於 0G 去中心化 AI Agent 網路的深空星際考古學家。請依據探測資料，原創解算一件極具特色、絕不重複的 0G 星際藏品。
必須嚴格、全部使用「繁體中文」（正體中文）輸出，嚴禁輸出任何簡體字！
不可包含 markdown 代碼塊之外的任何雜訊，必須輸出合法 JSON。

輸出格式規格：
{
  "title": "『量子拓撲』超光速躍遷核心",
  "lore": "在半人馬座黑洞邊緣吸積盤中，這件遺物歷經高能霍金輻射淬煉，表面銘刻著奇異的反引力燒蝕痕跡。當探測器接近時，其內部仍發出有規律的超空間電磁脈衝。",
  "personality": "高傲且神秘，偶爾散發冷色調的量子幽光",
  "stats": {
    "luck": ${baseLuck},
    "miningBonus": "${baseBonusStr}",
    "miningBonusValue": ${baseBonus},
    "capacityBonus": ${baseCapacity},
    "rarityScore": ${baseLuck},
    "specialTrait": "引力透鏡共振",
    "traitDescription": "產生超維度引力場，實時提升採礦速率 +${baseBonus} 幣/秒並擴充儲存池 ${baseCapacity} 金幣上限"
  }
}

【關鍵生成原則】：
1. title: 必須極具科幻張力與想像力（可結合星區特色、物理現象或荒誕風格，例如『彩虹蝕痕』反重力拖鞋、普朗克裂隙踏板、零度坍縮漫步履、『晶體爆裂者』突變兔、第42號小行星重型破冰機）。【嚴禁】千篇一律重複使用「星塵漫步者」、「月球突變兔核心」等常見套路！
2. lore: 必須將給定的【0G 探測星區】與【異常環境】緊密融入故事中，敘述其出土經過與奇異物理現象，長度約 2-3 句。
3. specialTrait 與 traitDescription: 必須緊扣給定的異常環境與故事主題打造專屬效果。
4. stats 數值請維持或微調給定的基準值。`
            },
            {
              role: "user",
              content: `【0G 探測星區】：${sector}
【探測異常環境】：${anomaly}
【科幻流派風格】：${genre}
【出土原型】：${archetypeName} (${rarity})
【量子觀測雜湊】：${quantumHash}
請以 0G 去中心化 AI Agent 身份，原創解算此藏品！`
            }
          ],
          temperature: dynamicTemp,
          max_tokens: 500,
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
            
            // Enrich with environmental provenance
            parsed.sector = sector;
            parsed.anomaly = anomaly;
            parsed.quantumHash = quantumHash;
            parsed.stats.sector = sector;
            parsed.stats.anomaly = anomaly;

            console.log(`[0G AI] Successfully received 0G decentralized AI generation: "${parsed.title}" (Sector: ${sector})`);
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

  // Resilient rich procedural generator (100% stable fallback with cosmic entropy)
  const traitObj = FALLBACK_TRAITS[Math.floor(Math.random() * FALLBACK_TRAITS.length)];
  const loreText = FALLBACK_LORES[Math.floor(Math.random() * FALLBACK_LORES.length)];
  const serialNo = Math.floor(Math.random() * 9000) + 1000;

  const adjectives = ["超維度", "零度坍縮", "極地低溫超導", "反物質浸潤", "第4維度投影", "高頻震盪", "普朗克尺度", "0G拓撲驗證"];
  const selectedAdj = adjectives[Math.floor(Math.random() * adjectives.length)];

  const luckRoll = Math.min(99, baseLuck + Math.floor(Math.random() * 8) - 3);
  const bonusVal = parseFloat((baseBonus + (Math.random() * 0.8 - 0.4)).toFixed(1));
  const capBonus = baseCapacity + Math.floor(Math.random() * 100) - 50;

  return {
    title: `「${selectedAdj}」${archetypeName} #${serialNo}`,
    lore: `出土於【${sector}】。在【${anomaly}】的極限條件下，${loreText}`,
    personality: Math.random() > 0.5 ? "高頻躁動，渴求更多反應爐能量反饋" : "沉穩自律，可精確過濾深空背景輻射干擾",
    sector,
    anomaly,
    quantumHash,
    stats: {
      luck: luckRoll,
      miningBonus: `+${Math.round(bonusVal * 10)}%`,
      miningBonusValue: bonusVal,
      capacityBonus: capBonus,
      rarityScore: luckRoll,
      specialTrait: traitObj.name,
      traitDescription: `${traitObj.desc}（產幣 +${bonusVal}/秒，儲能 +${capBonus} 金幣）`,
      sector,
      anomaly,
    },
  };
}

