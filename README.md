# IdleColl — 0G Deep Space Collector (星際放置收集與鏈上 AI 拍賣行)

> **0G Hackathon 參賽作品**：融合 **0G Serving (AI 故事與詞條生成)**、**0G Storage (去中心化 Metadata 永存)** 與 **0G Chain (NFT 確權與原生 0G 去中心化拍賣結算)** 的 Mobile-First PWA 星際放置收集手遊。

---

## 遊戲核心亮點

1. **傳統圖鑑的收集爽感 (12 格星際矩陣)**：
   - 玩家透過放置累積星際金幣、購買探測券進行「深空抽卡」。
   - 12 款精心設計的星際像素藏品（從過期太空泡麵到 0G 創世晶片），直觀點亮 0/12 至 12/12 收集進度。
2. **0G AI 賦予獨特靈魂**：
   - 每次抽卡由 **0G AI** 動態生成獨一無二的專屬稱號、星際背景傳奇故事、特殊特性與數值加成。
3. **0G Storage 永久封存**：
   - AI 生成的標準 ERC-721 Metadata 直接寫入 **0G Storage 去中心化節點**，生成 `0g://...` 不可篡改雜湊。
4. **0G Chain 自動鑄造與零摩擦體驗**：
   - 抽卡時由伺服器 Minter 錢包自動將 NFT 鑄造到玩家地址，**玩家抽卡完全零彈窗、零 Gas 負擔**！
5. **0G 拍賣行真實鏈上結算**：
   - 玩家間以 **0G 測試網原生代幣 (0G)** 進行點對點掛售與購買，合約即時完成原子轉移，在 0G Explorer 隨時可查。
6. **Mobile-First PWA 手遊體驗**：
   - 直式手遊沉浸版面（Max-w-md 440px 自適應）、底部 Tab Bar、輕量震動反饋 (Haptic Feedback)、適配 iPhone 瀏海與 Home Bar 安全區，支援「加入主畫面」獨立全螢幕運行。

---

## 專案架構 (Monorepo)

```text
IdleColl_0gHackson/
├── contracts/          # 0G Galileo 智能合約 (Hardhat + Solidity 0.8.28, cancun)
│   ├── contracts/
│   │   ├── IdleCollNFT.sol         # ERC-721 藏品合約 (支援 0G Storage URI)
│   │   └── IdleCollMarketplace.sol # 0G 原生幣結算市場合約
│   └── scripts/deploy.ts           # 一鍵部署至 0G Galileo 並同步 ABI
├── server/             # Fastify + TypeScript + Drizzle ORM + PostgreSQL 16
│   ├── src/services/
│   │   ├── zerog-ai.ts             # 0G Serving AI 推論引擎
│   │   ├── zerog-storage.ts        # 0G Storage 上傳與雜湊計算
│   │   └── chain-minter.ts         # 0G Chain 自動鑄造服務
│   └── src/routes/                 # 放置採礦 / 抽卡 / 圖鑑 / 拍賣 API
├── web/                # React 19 + Vite + TailwindCSS + Ethers v6
│   ├── src/components/ # Cockpit / Scanner / CodexMatrix / Marketplace / Navbar
│   └── public/items/   # 12 款星際藏品美術視覺
└── docker-compose.yml  # PostgreSQL + Backend + Frontend 容器化編排
```

---

## 快速啟動指南

### 方式一：Docker Compose 一鍵啟動 (推薦)

```bash
# 1. 複製環境變數範本
cp .env.example .env

# 2. 啟動所有容器 (PostgreSQL 16, Fastify Server, React Web)
docker compose up -d

# 3. 開啟瀏覽器
# 前端介面: http://localhost:5173
# 後端 API:  http://localhost:3001
# 公網正式上線: https://idlecoll.yayayayaya.xyz (Cloudflare Tunnel)
```

### 方式二：本地開發啟動 (Local Dev)

```bash
# 1. 啟動 PostgreSQL 資料庫
docker compose up -d postgres

# 2. 啟動後端
cd server
npm install
npm run dev

# 3. 啟動前端 (另開終端)
cd web
npm install
npm run dev
```

---

## 🌐 線上預覽與 Cloudflare Tunnel 部署

本專案配置 Cloudflare Tunnel 實現全球加速與 SSL 保護：
- **線上網址**：[https://idlecoll.yayayayaya.xyz](https://idlecoll.yayayayaya.xyz)
- **架構**：`Cloudflare Edge -> cloudflared tunnel -> Docker (idlecoll-web / Nginx) -> Fastify Server -> PostgreSQL 16`
- **一鍵啟動 Tunnel**：`docker compose up -d tunnel`

---

## 智能合約部署至 0G Galileo 測試網

合約工程已配置好 0G Galileo Testnet (Chain ID `16602`)：

```bash
cd contracts

# 執行單元測試 (驗證 NFT 鑄造、上架與原生幣購買結算)
npm test

# 部署至 0G Galileo 測試網 (需確保 .env 中 MINTER_PRIVATE_KEY 擁有少量 0G 測試幣)
npx hardhat run scripts/deploy.ts --network zeroG
```
*部署腳本執行後，會自動將最新的合約地址與 ABI 同步更新至 `web/src/contracts/contracts.json` 與 `server/src/contracts/contracts.json`。*

---

## 0G 網路配置參數

| 項目 | 參數值 |
|---|---|
| **Network Name** | 0G Galileo Testnet |
| **RPC URL** | `https://evmrpc-testnet.0g.ai` |
| **Chain ID** | `16602` (`0x40da`) |
| **Currency Symbol** | `0G` |
| **NFT Contract** | [`0x60479646778b63D9B42AD798151c634b131ACdA4`](https://chainscan-galileo.0g.ai/address/0x60479646778b63D9B42AD798151c634b131ACdA4) |
| **Marketplace Contract** | [`0xDF0677568b154499214A62a44f0C4D1EB8de6CBB`](https://chainscan-galileo.0g.ai/address/0xDF0677568b154499214A62a44f0C4D1EB8de6CBB) |
| **Block Explorer** | [https://chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| **Faucet 水龍頭** | [https://faucet.0g.ai/](https://faucet.0g.ai/) (每日領取 0.1 0G) |

---

## 手機遊玩與 PWA 安裝教學

1. **手機直接遊玩**：在手機端打開 **MetaMask App**，切換至內建瀏覽器，輸入線上正式網址 [https://idlecoll.yayayayaya.xyz](https://idlecoll.yayayayaya.xyz)，錢包將自動注入並引導切換至 0G 網路！
2. **加入主畫面 (PWA)**：在手機瀏覽器點擊「分享」->「加入主畫面 (Add to Home Screen)」，即可享有如原生 App 般的獨立全螢幕體驗。

