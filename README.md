# 霍家私塾 SVG 編輯器

> Web-based SVG 向量編輯與文字處理工具，支援 draw.io 流程圖匯入與文字編輯。
> 純前端、無框架、無後端依賴。

[![Version](https://img.shields.io/badge/version-0.1.1-4A90E2.svg)]()
[![License](https://img.shields.io/badge/license-MIT-5AC8A5.svg)]()
[![Single File](https://img.shields.io/badge/single--file-132KB-9B6EF3.svg)]()

## 線上 Demo

**直接使用（多檔版本）**：
https://kmuftp-creater.github.io/huobest-svg-editor/

**單檔下載（離線使用）**：
https://kmuftp-creater.github.io/huobest-svg-editor/dist/svg-editor.html

下載單檔後雙擊即可使用，無需安裝、無依賴。可放隨身碟、寄給朋友、上傳至內部網路。

## 一、快速開始

### 方式 A：下載單檔離線使用（推薦）
1. 至 [Releases](../../releases) 或 [`dist/svg-editor.html`](./dist/svg-editor.html) 下載單檔
2. 雙擊開啟即可使用，無需安裝
3. 檔案大小僅 132 KB，可隨身攜帶

### 方式 B：本地開發
```bash
git clone {repo-url}
cd huobest-svg-editor

# 直接開啟（或使用 Live Server）
start index.html

# 重新打包單檔
node build.js
```

### 方式 C：自部署
詳見 [`doc/04-deployment.md`](./doc/04-deployment.md)。
支援 GitHub Pages / Cloudflare Pages / Netlify / Vercel / Docker。

## 二、特色功能

### 編輯能力
- **形狀庫**：51 個形狀分 6 大類（一般、基本圖形、流程圖、箭頭、ER、UML）
- **三大屬性面板**：物件樣式、文字、調整（依選取自動切換）
- **智慧對齊輔助線**（Smart Guides）：6 px 內自動吸附，粉紅虛線指示
- **框選多物件**：Shift 加入既有選取
- **群組**：Ctrl+G / Ctrl+Shift+G
- **歷史紀錄**：50 筆 Undo / Redo

### 檔案 I-O
- **SVG / PNG / JPG 拖曳匯入**，自動依 viewBox 縮放至畫布
- **draw.io 格式深度支援**：保留 foreignObject 視覺、可獨立編輯每個文字
- **匯出 SVG**（向量）/ **匯出 PNG**（高品質點陣 1200×800）

### 互動設計
- 工具列：選擇 / 手型 / 文字 / 矩形 / 橢圓 / 直線
- 完整快捷鍵：V / H / T / R / O / L / Ctrl+Z / Ctrl+G / Space+拖曳 / 方向鍵微調
- 滑鼠：Ctrl+滾輪縮放、Shift+滾輪水平捲動
- 圖層 / 歷史紀錄整合至右側面板底部，點圖層平滑置中 + 光暈閃爍

### 視覺與主題
- 亮 / 暗主題切換（持久化 + 系統偏好偵測）
- 響應式（< 960 px 自動轉抽屜式）
- 霍家私塾品牌色盤
- Inter（英數）+ Noto Sans TC（中文）

## 三、技術架構

| 項目 | 內容 |
|---|---|
| 框架 | 無（Vanilla JS） |
| 構建工具 | Node.js（僅打包用，非必要） |
| 外部依賴 | Google Fonts（可離線移除） |
| 渲染引擎 | SVG DOM（即時操作） |
| 狀態管理 | 自製 IIFE 狀態機 |
| 歷史紀錄 | Action Stack + 深拷貝快照 |

詳細架構見 [`doc/01-architecture.md`](./doc/01-architecture.md)。

## 四、檔案結構

```
.
├── index.html              # 多檔開發版入口
├── styles.css              # 設計系統與元件樣式
├── app.js                  # 核心邏輯（約 75 KB）
├── shapes.js               # 形狀庫資料
├── build.js                # 單檔打包腳本
├── dist/
│   └── svg-editor.html     # 單檔版本（132 KB）
├── doc/
│   ├── README.md           # 開發紀錄總覽
│   ├── 01-architecture.md  # 技術架構
│   ├── 02-development-log.md  # 開發歷程
│   ├── 03-usage-guide.md   # 使用指南
│   ├── 04-deployment.md    # 部署指南
│   └── 05-roadmap.md       # 未來方向
├── CHANGELOG.md            # 版號紀錄
└── LICENSE                 # MIT
```

## 五、瀏覽器支援
- Chrome / Edge 90+
- Firefox 90+
- Safari 14+

必需 API：SVG DOM、`<foreignObject>`、DOMParser、XMLSerializer、FileReader、Pointer Events。

## 六、版號規則
- **Bug fix**：第三碼 +1（例：`0.1.1` → `0.1.2`）
- **新增功能**：第二碼 +1（例：`0.1.1` → `0.2.0`）
- **重大架構**：第一碼 +1（例：`0.5.0` → `1.0.0`）

完整變更見 [`CHANGELOG.md`](./CHANGELOG.md)。

## 七、開發

### 修改流程
1. 編輯 `index.html` / `styles.css` / `app.js` / `shapes.js`
2. 在瀏覽器中直接 reload 測試
3. 完成後執行 `node build.js` 重新打包單檔

### 貢獻
歡迎 Issue 與 Pull Request。
進行較大變更前建議先開 Issue 討論方向。

## 八、Roadmap

短期：
- v0.2.0 自動儲存（IndexedDB）
- v0.3.0 連接線（Connector）
- v0.4.0 真正的鋼筆工具

完整 Roadmap 見 [`doc/05-roadmap.md`](./doc/05-roadmap.md)。

## 九、授權

MIT License — 詳見 [`LICENSE`](./LICENSE)。

可自由用於商業 / 非商業用途，需保留版權與授權聲明。

## 十、聯絡

霍家私塾：[huobest.com](https://huobest.com/)

---

©2026 霍家私塾
