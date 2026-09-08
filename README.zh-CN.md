# IdleColl — 0G Deep Space Collector (星际放置收集与链上 AI 拍卖行)

<p align="center">
  <a href="README.md">繁體中文</a> | <strong>简体中文</strong>
</p>

<p align="center">
  <img src="web/public/items/chip.png" alt="IdleColl Logo" width="100" />
</p>

<p align="center">
  <strong>0G Hackathon 参赛作品</strong><br>
  结合 <b>0G Compute (去中心化 AI 推理)</b>、<b>0G Storage (去中心化 Metadata 存证)</b> 与 <b>0G Galileo Testnet (智能合约确权与去中心化结算)</b> 的 Mobile-First Web3 星际放置收集与拍卖手游。
</p>

---

## 🌟 游戏核心特色与重大突破

IdleColl 彻底重构了传统链游“数值枯燥”与“NFT 仅为静态图片”的弊病，打造出一个全流程与 0G 技术深度耦合的去中心化星际冒险世界：

### 1. 🧬 0G Compute 去中心化 AI 遗物解算引擎
* **真实去中心化 AI 推理**：直连 0G Compute Network，部署大语言模型 `qwen/qwen2.5-omni-7b` 担任“深空星际考古学家”。
* **绝不重复的原创灵魂**：每当探测任务完成，AI Agent 依据原型与稀有度实时解算专属称号（如“「星际巨兽之眼」戴森球能量碎块”）、星际历史由来与奇异现象传奇故事（`aiLore`）。
* **四大实体属性结构化输出**：动态赋予 ⚡ 采矿产能加成（`miningBonus`）、📦 离线容量扩充（`capacityBonus`）、🍀 幸运共振指数（`luck`）以及 🏷️ 独特色条与详细解析（`specialTrait` & `traitDescription`）。

### 2. ⚡ 星际舰队实体加成引擎 (Fleet Synergy Engine)
* **告别装饰用词条**：玩家持有的所有 NFT 藏品属性，将在后端实时聚合为舰队全局被动效果池！
  * **采矿产能实体累加**：基础 `10 币/秒 + Σ(藏品 bonusMiningRate)`，每秒产出真实倍增。
  * **离线容量无缝扩充**：基础 `1000 上限 + Σ(藏品 capacityBonus)`，大幅延长离线收益积累时间。
  * **2x 双倍暴击采收 (Critical Harvest)**：舰队幸运值（最高 99）将动态转化为收取金币时的双倍暴击几率（最高达 35%），触发 0G 能量共振！

### 3. 📦 0G Storage 去中心化永久封存
* AI 解算生成的标准 ERC-721 Metadata 直接打包上传至 **0G Storage 去中心化存储节点**。
* 每件藏品均生成不可篡改的 `0g://...` 存证 Root Hash，并可在拍卖行与图鉴中实时溯源检测。

### 4. 💎 0G 链上原生拍卖行与全息检测仪 (Marketplace & Holographic Inspector)
* **0G 原生币撮合结算**：买卖全程在 0G Galileo 测试链上以原生 0G 代币进行，0% 平台手续费，售出代币 100% 直拨卖家钱包。
* **可视化藏品横向轮播轨道 (Visual Selector Rail)**：告别简陋下拉菜单，卡片化展示微缩图、稀有度徽章与 Token ID，点选实时切换。
* **上架全息实时检测**：上架前完整预览 AI 背景故事、4 大实体属性砖、0G Storage Root 与舰队托管产能提示。
* **快捷定价胶囊**：提供 `0.001 0G`、`0.005 0G`、`0.01 0G`、`0.05 0G` 一键填入。
* **买家全方位过滤**：支持全文模糊搜索（名称/词条/Token ID）、稀有度标签筛选、五向排序（价格低/高、产能最高、幸运最高、Token ID）。

### 5. 🚀 全流程异步 Loading 与极致 UX
* **全站转圈圈动态反馈 (`Loader2` animate-spin)**：连接钱包、切换网络、拍卖上架（Approve/List 双阶段）、购买交易、下架撤回、收取收益、购买探测券等所有按钮均具备动态旋转加载与防连点锁定。
* **平滑动态签名者解析**：切换网络不重载网页（彻底移除 `window.location.reload()`），动态调用 MetaMask，保留弹窗与操作状态。
* **智能预先授权检查**：上架时自动检查链上授权，已授权项目自动跳过 Approve 步骤，省时更省 Gas。

---

## 📱 Mobile-First PWA 架构

IdleColl 专为智能手机与移动端 Web3 钱包精心打造：
* **沉浸式坚屏规格**：`max-w-lg min-h-[100dvh]`，适配 iPhone 灵动岛、刘海与底部横条安全区 (`pb-safe`)。
* **MetaMask 手机 App 深度整合**：提供一键唤醒 App 连接与内置专用浏览器跳转支持。
* **PWA 独立 App 运行**：支持手机浏览器“添加到主屏幕 (Add to Home Screen)”，提供如同原生 App 的全屏沉浸操作体验。

---

## 🏗️ 项目技术架构 (Monorepo)

```text
IdleColl_0gHackson/
├── contracts/                  # 0G Galileo 智能合约 (Hardhat + Solidity 0.8.28)
│   ├── contracts/
│   │   ├── IdleCollNFT.sol         # ERC-721 藏品合约 (支持 0G Storage URI)
│   │   └── IdleCollMarketplace.sol # 0G 原生币去中心化拍卖合约 (免手续费、安全托管)
│   └── scripts/deploy.ts           # 一键部署至 0G 测试网并自动同步 ABI
├── server/                     # Fastify + TypeScript + Drizzle ORM + PostgreSQL 16
│   ├── src/services/
│   │   ├── zerog-ai.ts             # 0G Compute AI 网络推理解算引擎 (qwen2.5-omni-7b)
│   │   ├── zerog-storage.ts        # 0G Storage 永存节点上传与哈希计算
│   │   ├── chain-minter.ts         # 0G 区块链代付自动铸造服务
│   │   └── gacha-queue.ts          # 深空探测异步排程队列 (上限 2 并发)
│   └── src/routes/                 # 采矿产率 / 探测任务 / 星际图鉴 / 拍卖行 API
├── web/                        # React 19 + Vite 6 + TailwindCSS + Ethers v6
│   ├── src/components/
│   │   ├── IdleCockpit.tsx         # 采矿舱仪表板 (反应堆、储能池进度、探测券兑换)
│   │   ├── DeepSpaceScanner.tsx    # 深空探测雷达 (动态扫描波、异步任务进度卡)
│   │   ├── CodexMatrix.tsx         # 12 格星际图鉴矩阵 (变体展开、属性透析)
│   │   ├── Marketplace.tsx         # 0G 拍卖行 (可视化上架、全息检测仪、买卖合约)
│   │   ├── ConnectWalletModal.tsx  # 多端钱包认证协议弹窗 (插件与手机唤醒)
│   │   └── Navbar.tsx              # 顶部导航栏 (实时资源条、舰长昵称、网络切换)
│   └── src/hooks/
│       └── useWeb3.ts              # 零重载 Web3 核心钩子 (Provider/Signer 动态切换)
└── docker-compose.yml          # PostgreSQL + Fastify + Web 容器化一键编排
```

---

## ⚡ 快速开始 (Quick Start)

### 方式一：Docker Compose 一键启动 (推荐)

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 启动所有容器 (PostgreSQL 16, Fastify Server, React Web)
docker compose up -d

# 3. 浏览器访问
# 前端游戏界面: http://localhost:5173
# 后端 API 服务: http://localhost:3001
```

### 方式二：本地开发启动 (Local Dev)

```bash
# 1. 启动数据库
docker compose up -d postgres

# 2. 启动后端服务
cd server
npm install
npm run dev

# 3. 启动前端界面 (另开终端)
cd web
npm install
npm run dev
```

---

## ⛓️ 0G Galileo 测试网络参数

| 配置项目 | 参数值 |
| :--- | :--- |
| **网络名称 (Network Name)** | 0G Galileo Testnet |
| **RPC 节点** | `https://0g-galileo-testnet.drpc.org` / `https://evmrpc-testnet.0g.ai` |
| **链 ID (Chain ID)** | `16602` (`0x40da`) |
| **货币符号 (Symbol)** | `0G` |
| **区块浏览器 (Explorer)** | [https://chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| **官方水龙头 (Faucet)** | [https://faucet.0g.ai/](https://faucet.0g.ai/) (每日可领取 0.1 0G 测试币) |
| **NFT 智能合约** | [`0x60479646778b63D9B42AD798151c634b131ACdA4`](https://chainscan-galileo.0g.ai/address/0x60479646778b63D9B42AD798151c634b131ACdA4) |
| **拍卖行智能合约** | [`0xDF0677568b154499214A62a44f0C4D1EB8de6CBB`](https://chainscan-galileo.0g.ai/address/0xDF0677568b154499214A62a44f0C4D1EB8de6CBB) |

---

## 🛠️ 智能合约指令

合约目录位于 `contracts/`，使用 Hardhat 构建：

```bash
cd contracts

# 执行自动化测试 (包含 NFT 铸造、市场合约上架、买卖交割与下架验证)
npm test

# 部署至 0G Galileo 测试网
npx hardhat run scripts/deploy.ts --network zeroG
```
*部署完成后，脚本会自动同步最新的合约地址与 ABI 至前端与后端项目目录。*

---

## 🌐 线上体验与 PWA 安装说明

1. **线上体验网址**：[https://idlecoll.yayayayaya.xyz](https://idlecoll.yayayayaya.xyz)
2. **手机钱包浏览**：
   - 打开 **MetaMask App** ➔ 点击底部“浏览器”图标 ➔ 输入网址即可直接游玩。
   - 钱包将自动弹出 0G Galileo 测试网络的切换与添加引导。
3. **PWA 全屏体验**：
   - 在 Safari 或 Chrome 点击“分享”或“更多菜单”➔ 点击“添加到主屏幕 (Add to Home Screen)”，即可享有免地址栏的原生手游体验！

---

## 📜 开源许可

本项目遵循 [MIT License](LICENSE) 开源协议。欢迎 0G 社区开发者进行 Fork、交流与二次创作！
