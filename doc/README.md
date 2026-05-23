# 霍家私塾 SVG 編輯器 — 開發紀錄

## 一、專案資訊
| 項目 | 內容 |
|---|---|
| 系統名稱 | 霍家私塾 SVG 編輯器（HuoBest SVG Editor） |
| 當前版本 | v0.1.1（2026-05-23 暫停點） |
| 技術棧 | 純 HTML / CSS / JavaScript（無框架依賴） |
| 部署形式 | 三檔靜態網頁（`index.html` + `styles.css` + `app.js` + `shapes.js`） |
| 主要使用情境 | 讀取 draw.io 匯出的 SVG 流程圖、編輯文字內容、匯出 SVG / PNG |

## 二、檔案結構
```
D:\Claude\SVG Editor\
├── index.html              # 應用程式骨架（Header / 三欄主視圖 / Footer / Modal）
├── styles.css              # 設計系統 + 主題 + 元件樣式
├── app.js                  # 核心邏輯（state / render / 互動 / I-O）
├── shapes.js               # 形狀庫資料（6 大分類，51 個形狀）
├── CHANGELOG.md            # 版號變更紀錄
├── doc/                    # 本紀錄資料夾
│   ├── README.md
│   ├── 01-architecture.md
│   ├── 02-development-log.md
│   ├── 03-usage-guide.md
│   ├── 04-deployment.md
│   └── 05-roadmap.md
└── SVG 專業向量編輯與文字處理軟體/
    ├── 🎨 ... PRD_BeginnerGuide-1.md   # 使用者原始 PRD
    ├── 🎨 ... PRD_TechnicalSpec.md     # 技術規格
    ├── image0~image6.png               # UI 設計參考圖
    ├── 流程圖模版-250706-Tahoma.svg     # draw.io 測試範本
    └── 流程圖模版-250706-Verdana.svg
```

## 三、已實作功能
### 1. 核心編輯
- 形狀建立：rect、ellipse、line（V / R / O / L 快捷鍵）
- 文字物件：T 工具，雙擊內嵌編輯，右側 textarea 即時編輯
- 選取 / 變形 / 旋轉 / 翻轉 / 縮放
- 框選多物件（Marquee Selection，Shift 加入既有選取）
- 智慧對齊輔助線（Smart Guides，6px 內自動吸附，Alt 暫停）
- 群組（Ctrl+G / Ctrl+Shift+G）
- 鎖定 / 解鎖物件、顯示 / 隱藏
- 圖層次序（最上層 / 最下層 / 上移 / 下移）

### 2. 檔案 I-O
- SVG / PNG / JPG 拖曳上傳
- draw.io（mxGraph）格式 SVG 完整支援（含 foreignObject 文字編輯）
- 自動編號（item-01、item-02、text-XX、svg-XX）
- 大尺寸自動縮放至畫布（保留 5% 邊距）
- 匯出 SVG（向量）
- 匯出 PNG（高品質點陣）

### 3. UI 與主題
- 三大屬性面板：物件樣式 / 文字 / 調整（自動依選取類型切換）
- 右側底部整合：圖層 / 歷史紀錄
- 亮 / 暗主題切換（持久化 + 系統偏好偵測）
- 響應式（< 960px 自動轉抽屜式）
- 預設色卡 8 色（霍家私塾色盤）

### 4. 互動
- 工具列：選擇 / 手型 / 文字 / 矩形 / 橢圓 / 直線
- 快捷鍵：V / H / T / R / O / L / Ctrl+Z / Ctrl+Y / Ctrl+G / Ctrl+Shift+G / Ctrl+D / Ctrl+A / Ctrl+S / Delete / Space+拖曳 / 方向鍵微調
- 滾輪縮放（Ctrl+滾輪）、Shift+滾輪水平捲動
- 點圖層自動平滑捲動置中 + 藍光暈閃爍
- 雙擊物件 → 內嵌 contentEditable 編輯

### 5. 設計系統（霍家私塾標準）
- 主色：#4A90E2（CTA / 主動狀態）
- 次色：#9B6EF3（裝飾）
- 中性：背景 #F5F7FA、表面 #FFFFFF、主文字 #1F2937
- 語意色：#5AC8A5（Success）、#F06292（Error）、#FFB74D（Warning）、#4FC3F7（Info）
- 字型：Inter（英數）+ Noto Sans TC（中文）
- 圓角：按鈕 8px、卡片 12px、膠囊 999px
- 網格：8px 基準步進

## 四、版本里程碑
| 版本 | 完成項目 | 日期 |
|---|---|---|
| v0.0.1 | MVP 骨架（HTML / CSS / JS / 形狀庫 / 範例流程圖） | 2026-05-23 |
| v0.0.2 | draw.io 匯入支援、Inline 文字編輯、Space 平移 | 2026-05-23 |
| v0.0.3 | 清除、手型、智慧對齊、框選、群組 | 2026-05-23 |
| v0.0.4 | 文字編輯失效修正、UI 清理 | 2026-05-23 |
| v0.0.5 | 圖層 / 歷史紀錄合併右側、文字內容區 | 2026-05-23 |
| v0.0.6 | 文字重複、自動分頁、形狀去重、移除鋼筆 | 2026-05-23 |
| v0.0.7 - 0.0.8 | 文字溢出修正嘗試（widthBoost / clip） | 2026-05-23 |
| v0.1.0 | Ghost 物件架構（架構重設計） | 2026-05-23 |
| v0.1.1 | 命名空間污染修正（DOMParser） | 2026-05-23 |

## 五、版號規則
- **Bug fix（修正）**：第三碼 +1（例：`0.1.1` → `0.1.2`）
- **新增功能**：第二碼 +1、第三碼歸 0（例：`0.1.1` → `0.2.0`）
- **重大架構變更**：第一碼 +1、後兩碼歸 0（例：`0.2.5` → `1.0.0`）

## 六、待辦事項（休息後接續）
1. 打包為單檔（inline CSS / JS / shapes 至單一 HTML）
2. 部署選項（Netlify / Vercel / GitHub Pages / 本地靜態伺服器）
3. 詳見 `05-roadmap.md`

## 七、參考資料
- [`01-architecture.md`](./01-architecture.md)：技術架構與資料模型
- [`02-development-log.md`](./02-development-log.md)：開發歷程與決策紀錄
- [`03-usage-guide.md`](./03-usage-guide.md)：使用者操作指南
- [`04-deployment.md`](./04-deployment.md)：部署與打包指南
- [`05-roadmap.md`](./05-roadmap.md)：未來優化方向
- [`../CHANGELOG.md`](../CHANGELOG.md)：版號變更紀錄
