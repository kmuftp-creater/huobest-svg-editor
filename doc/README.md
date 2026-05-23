# 霍家私塾 SVG 編輯器 — 開發紀錄

## 一、專案資訊
| 項目 | 內容 |
|---|---|
| 系統名稱 | 霍家私塾 SVG 編輯器（HuoBest SVG Editor） |
| 當前版本 | **v0.2.6**（2026-05-23 告一段落版本） |
| 技術棧 | 純 HTML / CSS / JavaScript（無框架依賴） |
| 部署形式 | 多檔開發版 + 單檔發佈版（`dist/svg-editor.html`） |
| 線上 Demo | https://kmuftp-creater.github.io/huobest-svg-editor/ |
| GitHub Repo | https://github.com/kmuftp-creater/huobest-svg-editor |
| 主要使用情境 | 讀取 draw.io 匯出的 SVG 流程圖、編輯文字內容、匯出 SVG / PNG |

## 二、檔案結構
```
D:\Claude\SVG Editor\
├── index.html                    # 應用程式骨架
├── styles.css                    # 設計系統 + 元件樣式
├── app.js                        # 核心邏輯（約 80 KB）
├── shapes.js                     # 形狀庫資料（51 個形狀，6 分類）
├── build.js                      # 單檔打包腳本
├── README.md                     # 公開 README（給 repo 訪客）
├── CHANGELOG.md                  # 完整版號變更紀錄
├── LICENSE                       # MIT License
├── .gitignore
├── dist/
│   └── svg-editor.html           # 打包後的單檔版本（~150 KB）
├── doc/                          # 本紀錄資料夾
│   ├── README.md                 # 開發紀錄總覽（本檔）
│   ├── 01-architecture.md        # 技術架構與資料模型
│   ├── 02-development-log.md     # 開發歷程與決策紀錄
│   ├── 03-usage-guide.md         # 使用者操作指南
│   ├── 04-deployment.md          # 部署與打包指南
│   └── 05-roadmap.md             # 未來優化方向
└── SVG 專業向量編輯與文字處理軟體/
    ├── 🎨 ... PRD_BeginnerGuide-1.md
    ├── image0~image6.png
    ├── 流程圖模版-250706-Tahoma.svg     # draw.io 測試範本
    └── 流程圖模版-250706-Verdana.svg
```

## 三、已實作功能

### 1. 核心編輯
- 形狀建立：rect、ellipse、line（V / R / O / L 快捷鍵）
- 文字物件：T 工具、雙擊內嵌編輯、右側 textarea 即時編輯
- 選取 / 變形 / 旋轉 / 翻轉 / 縮放
- 框選多物件（Marquee Selection，Shift 加入既有選取）
- 智慧對齊輔助線（Smart Guides，6 px 內自動吸附，Alt 暫停）
- 群組（Ctrl + G / Ctrl + Shift + G）
- 鎖定 / 解鎖物件、顯示 / 隱藏
- 圖層次序（最上層 / 最下層 / 上移 / 下移）

### 2. 檔案 I-O
- SVG / PNG / JPG 拖曳上傳
- **draw.io（mxGraph）格式 SVG 完整支援**（Ghost 物件架構）
- 自動編號（item-01、item-02、text-XX、svg-XX）
- 大尺寸自動縮放至畫布（保留 5% 邊距）
- 匯出 SVG（向量）
- 匯出 PNG（高品質點陣）

### 3. UI 與主題
- 三大屬性面板：物件樣式 / 文字 / 調整（自動依選取類型切換）
- 右側底部整合：圖層 / 歷史紀錄
- 亮 / 暗主題切換（**v0.2.5 起預設暗色**、持久化）
- 響應式（< 960 px 自動轉抽屜式）
- 預設色卡 8 色（霍家私塾色盤）
- **全繁體中文介面**（v0.2.6 完成所有 UI 文案中文化）

### 4. 互動
- 工具列：選擇 / 手型 / 文字 / 矩形 / 橢圓 / 直線
- 快捷鍵：V / H / T / R / O / L / Ctrl+Z / Ctrl+Y / Ctrl+G / Ctrl+Shift+G / Ctrl+D / Ctrl+A / Ctrl+S / Delete / Space+拖曳 / 方向鍵微調
- 滾輪縮放（Ctrl+滾輪）、Shift+滾輪水平捲動
- 點圖層自動平滑捲動置中 + 藍光暈閃爍
- 雙擊物件 → 內嵌 contentEditable 編輯

### 5. draw.io 進階能力（**v0.2.x 核心特色**）
- **Ghost 物件架構**：compound 保留原始 foreignObject 視覺，ghost 物件提供文字編輯介面，雙向綁定同步
- **拆解匯入**：將 compound shape 展開為個別可編輯物件（rect / ellipse / path / text 與原生 SVG `<text>`）
- **對齊文字至圖形**：拆解後自動將每個文字對齊到所在的形狀內部，含自動縮小字級確保完整顯示
- **compound 縮放時 ghost 同步變形**：拖曳壓縮 / 拉大整張匯入時，文字位置與字級依比例跟隨

### 6. 設計系統（霍家私塾標準）
- 主色：#4A90E2（CTA / 主動狀態）
- 次色：#9B6EF3（裝飾、ghost 標記）
- 中性：背景 #F5F7FA、表面 #FFFFFF、主文字 #1F2937
- 語意色：#5AC8A5（Success）、#F06292（Error）、#FFB74D（Warning）、#4FC3F7（Info）
- 字型：Inter（英數）+ Noto Sans TC（中文）
- 圓角：按鈕 8 px、卡片 12 px、膠囊 999 px
- 網格：8 px 基準步進

## 四、版本里程碑

| 版本 | 主軸 | 關鍵變更 |
|---|---|---|
| v0.0.1 | MVP 骨架 | 三大屬性面板、形狀庫、範例流程圖 |
| v0.0.2 | draw.io 支援初版 | foreignObject 解析、Inline 文字編輯、Space 平移 |
| v0.0.3 | 向量編輯基本功 | 清除、手型、智慧對齊、框選、群組 |
| v0.0.4 | UX 修正 | 文字編輯失效修正、UI 清理 |
| v0.0.5 | 結構整併 | 圖層 / 歷史合併右側、文字內容區、置中閃爍 |
| v0.0.6 | 重複修正 + 清理 | 文字重複修正、自動切分頁、形狀去重、移除鋼筆 |
| v0.0.7 - 0.0.8 | 文字溢出修正嘗試 | widthBoost / clip 都失敗（為 v0.1.0 鋪路）|
| v0.1.0 | **架構重設計** | Ghost 物件架構：compound 保留 foreignObject、ghost 只負責編輯介面 |
| v0.1.1 | 命名空間污染 | DOMParser + XMLSerializer 處理 SVG 字串 |
| v0.1.2 | 打包工具 bug | build.js `$$` 被 replace 吃掉導致所有按鈕無反應 |
| v0.1.3 | 縮放捲動 + ghost 跟隨 | safe center、compound 變形時 ghost 同步 |
| v0.2.0 | **拆解匯入功能** | Decompose、ghost 控點隱藏、換行支援 |
| v0.2.1 | 拆解後排版 | useForeignObject 啟用 word-wrap、對齊文字按鈕 |
| v0.2.2 | 原生 `<text>` 支援 | 拆解漏掉的 SVG 原生 text 元素 |
| v0.2.3 | 對齊裁切修正 | padding 與 bbox 高度動態決定 |
| v0.2.4 | 自動縮字級 | 拆解時字級下限 + 對齊時實測字級 |
| v0.2.5 | **全面中文化 + 暗色** | Auto / Convert / Snap / Explore、預設暗色、形狀庫只展一般 |
| v0.2.6 | 補漏 | Sketch → 草圖 |

## 五、版號規則
- **Bug fix（修正）**：第三碼 +1（例：`0.2.5` → `0.2.6`）
- **新增功能**：第二碼 +1、第三碼歸 0（例：`0.2.6` → `0.3.0`）
- **重大架構變更**：第一碼 +1、後兩碼歸 0（例：`0.5.0` → `1.0.0`）

## 六、部署資訊
| 項目 | 內容 |
|---|---|
| Repo | https://github.com/kmuftp-creater/huobest-svg-editor |
| Pages（多檔） | https://kmuftp-creater.github.io/huobest-svg-editor/ |
| Pages（單檔） | https://kmuftp-creater.github.io/huobest-svg-editor/dist/svg-editor.html |
| 部署平台 | GitHub Pages（main / root） |
| CI/CD | Git push 自動觸發 Pages 重新部署（約 1~3 分鐘） |

## 七、後續方向（休息後可接續）
1. **自動儲存（IndexedDB）**：避免重整丟工作（P0，4 hr）
2. **連接線（Connector）**：流程圖核心功能（P1，8 hr）
3. **真正鋼筆工具**：錨點與貝茲曲線編輯（P1，12 hr）
4. **多選對齊 / 分布**：左中右上下對齊（P1，4 hr）
5. **PWA 離線支援**：Service Worker + manifest（P2，4 hr）

完整 Roadmap 見 [`05-roadmap.md`](./05-roadmap.md)。

## 八、本資料夾索引
- [`README.md`](./README.md)：開發紀錄總覽（本檔）
- [`01-architecture.md`](./01-architecture.md)：技術架構與資料模型（含 Ghost 物件）
- [`02-development-log.md`](./02-development-log.md)：完整開發歷程與決策紀錄
- [`03-usage-guide.md`](./03-usage-guide.md)：使用者操作指南
- [`04-deployment.md`](./04-deployment.md)：部署與打包指南
- [`05-roadmap.md`](./05-roadmap.md)：未來優化方向
- [`../CHANGELOG.md`](../CHANGELOG.md)：完整版號變更紀錄
