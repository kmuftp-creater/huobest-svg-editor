# 霍家私塾 SVG 編輯器 — 開發紀錄

## 一、專案資訊
| 項目 | 內容 |
|---|---|
| 系統名稱 | 霍家私塾 SVG 編輯器（HuoBest SVG Editor） |
| 當前版本 | **v0.7.1**（2026-05-29 工作中） |
| 技術棧 | 純 HTML / CSS / JavaScript（無框架依賴） |
| 部署形式 | 多檔開發版 + 單檔發佈版（`dist/svg-editor.html`） |
| 線上 Demo | https://kmuftp-creater.github.io/huobest-svg-editor/ |
| GitHub Repo | https://github.com/kmuftp-creater/huobest-svg-editor |
| 主要使用情境 | 讀取 / 編輯 / 製作 SVG 流程圖、心智圖、組織圖、UML、甘特圖等 |

## 二、檔案結構
```
D:\Claude\SVG Editor\
├── index.html                  # 應用程式骨架
├── styles.css                  # 設計系統 + 元件樣式
├── app.js                      # 核心邏輯（約 110 KB）
├── shapes.js                   # 形狀庫資料 + 24 色卡
├── templates.js                # 範本邏輯（內建範本 + SVG 範本載入）
├── templates-data.js           # 自動生成：12 個專業 SVG 範本（~127 KB）
├── generate-templates.js       # 範本生成腳本（讀範本/new/*.svg）
├── build.js                    # 單檔打包腳本
├── README.md                   # 公開 README
├── CHANGELOG.md                # 完整版號變更紀錄
├── LICENSE                     # MIT License
├── .gitignore
├── dist/
│   └── svg-editor.html         # 打包後的單檔版本（~370 KB）
├── doc/                        # 開發紀錄資料夾
│   ├── README.md               # 本檔
│   ├── 01-architecture.md      # 技術架構與資料模型
│   ├── 02-development-log.md   # 開發歷程與決策紀錄
│   ├── 03-usage-guide.md       # 使用者操作指南
│   ├── 04-deployment.md        # 部署與打包指南
│   └── 05-roadmap.md           # 未來優化方向
├── 範本/
│   ├── new/                    # 專業 SVG 範本素材（13 個 .svg）
│   └── *.jpg                   # 範本參考圖
└── 功能/                       # 心智圖工具列功能參考截圖
```

## 三、已實作功能

### 1. 核心編輯
- 形狀建立：rect、ellipse、line（V / R / O / L 快捷鍵）
- 文字物件：T 工具、雙擊內嵌編輯、右側 textarea 即時編輯
- 選取 / 變形 / 旋轉 / 翻轉 / 縮放（含 ratio-lock）
- 框選多物件（Shift 加入既有選取）
- 智慧對齊輔助線（6 px 內自動吸附，Alt 暫停）
- 群組（Ctrl + G / Ctrl + Shift + G）
- 鎖定 / 解鎖物件、顯示 / 隱藏

### 2. 節點自動連接（**v0.4.0 新增**）
- 連接線（Connector）資料模型：`fromId / toId` 指向兩端物件
- 動態錨點計算：取邊界最接近對方的點（不穿過形狀）
- 物件移動 / 縮放時連線自動跟隨
- 四個節點操作：
  - 下級節點（Tab）/ 同級節點（Enter）/ 上級節點（Shift+Tab）
  - 關係線（F4）— 兩物件建立虛線連接
- 刪除節點時相關連線自動清除

### 3. 外框 / 格式刷（v0.5.1）
- **外框**（Ctrl + Alt + B）：自動產生 dashed 框包覆選取
- **格式刷**：Ctrl + Shift + C 複製樣式 / Ctrl + Shift + V 貼上
- 14 項樣式屬性（fill / stroke / font / text 等）

### 4. 檔案 I-O
- SVG / PNG / JPG / **JSON** 拖曳上傳
- draw.io（mxGraph）格式 SVG 完整支援（Ghost 物件架構）
- 自動編號（item-01、text-XX、svg-XX、conn-XX 等）
- 大尺寸自動縮放至畫布（保留 5% 邊距）
- 匯出 SVG（向量）/ PNG（高品質點陣）

### 5. 範本系統（**v0.6.0 重構 + v0.7.0 自訂**）
- **內建範本 18 個**：
  - 6 個簡單範本（水平流程、判斷流程、時間軸、四象限、SWOT、甘特圖）
  - 12 個專業 SVG 範本（從 `範本/new/*.svg` 自動載入）：
    - 心智圖：高雄景點、AI 工具分類 (2026)、PMP 十大領域
    - 結構：專案成員、部門成員、台灣家族族譜
    - 流程：粉彩流程圖、客服處理泳道圖
    - 矩陣：商業模式畫布
    - 分析：6M 魚骨圖
    - 時序：時間軸分析法
    - UML：課程平台使用案例
- **自訂範本（v0.7.0）**：
  - 「儲存範本」按鈕 → 寫入 localStorage 永久保存
  - 範本面板顯示「自訂範本」+「內建範本」兩區
  - 可改名 / 匯出 JSON 備份 / 刪除 / 同名覆蓋
  - 跨 session 持久保存
- **拆解匯入**：將 SVG 範本拆為個別可編輯物件
  - v0.6.1 改進：保留 CSS class 套用後的計算樣式（fill / stroke / font）

### 6. UI 與主題
- 三大屬性面板：物件樣式 / 文字 / 調整（自動依選取類型切換）
- 右側底部整合：圖層 / 歷史紀錄
- 亮 / 暗主題切換（v0.2.5 起預設暗色、持久化）
- 響應式（< 960 px 自動轉抽屜式）
- 24 色預設色卡（8 色相 × 3 亮度，Material Design 50/100/200 色階）
- **全繁體中文介面**

### 7. 互動與快捷鍵（6 大類）
- **工具**：V / H / T / R / O / L
- **節點操作**：Tab / Enter / Shift+Tab / F4 / Ctrl+Alt+B / Ctrl+Shift+C / Ctrl+Shift+V
- **編輯**：Ctrl+Z / Y / D / A / S / Delete
- **群組**：Ctrl+G / Ctrl+Shift+G
- **移動變形**：方向鍵 / Shift+方向鍵 / Shift+拖曳控點 / Alt+拖曳
- **視窗**：Space+拖曳 / Ctrl+滾輪 / Shift+滾輪 / Esc

### 8. 設計系統（霍家私塾標準）
- 主色：#4A90E2（CTA / 主動狀態）
- 次色：#9B6EF3（裝飾、ghost 標記）
- 語意色：#5AC8A5、#F06292、#FFB74D、#4FC3F7
- 字型：Inter（英數）+ Noto Sans TC（中文）
- 圓角：按鈕 8 px、卡片 12 px、膠囊 999 px
- 網格：8 px 基準步進

## 四、版本里程碑

| 版本 | 主軸 | 關鍵變更 |
|---|---|---|
| v0.0.1 | MVP 骨架 | 三大屬性面板、形狀庫、範例流程圖 |
| v0.0.2 - 0.0.5 | 基礎功能 | draw.io 支援、智慧對齊、框選、群組、文字編輯修正、UI 整理 |
| v0.0.6 - 0.0.8 | 文字溢出嘗試 | widthBoost / clip 三輪失敗，逼出架構重設計 |
| v0.1.0 | **Ghost 架構** | compound + ghost 雙軌：視覺與編輯解耦 |
| v0.1.1 | 命名空間污染 | DOMParser + XMLSerializer 處理 SVG |
| v0.1.2 | 打包工具 bug | $$ 被 replace 吃掉 → 函式回呼修正 |
| v0.1.3 | 縮放捲動 | safe center + compound 變形時 ghost 同步 |
| v0.2.x | 拆解匯入 | 拆解功能、對齊文字、字級自動縮放 |
| v0.2.5 - 0.2.6 | UX 收尾 | 全面中文化、預設暗色、按鈕直書修正 |
| v0.2.7 | 色卡擴充 | 8 → 24 色柔和配色 |
| v0.3.0 | **範本系統** | 左側「範本」分頁 + 6 個內建範本 |
| v0.3.1 | 色卡重設計 + 範本擴充 | 8 色相 × 3 亮度、新增 8 個範本 |
| v0.4.0 | **Connector 系統** | 節點自動連線、Tab/Enter/Shift+Tab/F4 快捷鍵 |
| v0.5.1 | line 對角線修正 | 外框、格式刷、熱鍵分群 |
| v0.6.0 | **SVG 範本系統重構** | 13 個專業 SVG 範本、CSS class 範圍化、buildFromSvg |
| v0.6.1 | 拆解 SVG 範本 | getComputedStyle 保留 CSS 套用樣式 |
| v0.7.0 | **自訂範本管理** | localStorage 持久化、可覆蓋 / 刪除 / 改名 / 匯出 |
| v0.7.1 | AI 範本更新 | 採用 2026 版（2700×1500）避免遮蔽問題 |

## 五、版號規則
- **Bug fix**：第三碼 +1（例：`0.7.0` → `0.7.1`）
- **新增功能**：第二碼 +1、第三碼歸 0（例：`0.7.1` → `0.8.0`）
- **重大架構變更**：第一碼 +1（例：`0.9.x` → `1.0.0`）

## 六、部署資訊
| 項目 | 內容 |
|---|---|
| Repo | https://github.com/kmuftp-creater/huobest-svg-editor |
| Pages（多檔） | https://kmuftp-creater.github.io/huobest-svg-editor/ |
| Pages（單檔） | https://kmuftp-creater.github.io/huobest-svg-editor/dist/svg-editor.html |
| 部署平台 | GitHub Pages（main / root） |
| CI/CD | Git push 自動觸發 Pages 重新部署（約 1~3 分鐘） |

## 七、本資料夾索引
- [`README.md`](./README.md)：開發紀錄總覽（本檔）
- [`01-architecture.md`](./01-architecture.md)：技術架構與資料模型（含 Ghost、Connector）
- [`02-development-log.md`](./02-development-log.md)：完整開發歷程與決策紀錄
- [`03-usage-guide.md`](./03-usage-guide.md)：使用者操作指南
- [`04-deployment.md`](./04-deployment.md)：部署與打包指南
- [`05-roadmap.md`](./05-roadmap.md)：未來優化方向
- [`../CHANGELOG.md`](../CHANGELOG.md)：完整版號變更紀錄
