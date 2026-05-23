# 技術架構與資料模型

## 一、整體架構
單頁應用（SPA），無框架依賴，三檔分離：

```
index.html          → DOM 結構 + 主題啟動腳本
styles.css          → 設計系統（CSS Variables）+ 元件樣式 + 響應式
shapes.js           → 形狀庫資料（純資料，window.__SHAPES__ / __PRESETS__）
app.js              → 核心邏輯（IIFE 自執行函式，內部 state 管理）
```

設計理由：
- 無 build step，可直接於瀏覽器執行（雙擊 `index.html` 即可）
- 無外部依賴，僅 Google Fonts 一個 CDN（Inter + Noto Sans TC）
- 適合單檔打包（後續可 inline 為一個 HTML）

## 二、資料模型

### Object（物件）
每個畫布上的元素都是一個物件，存於 `state.objects` 陣列中：

```js
{
  id: 'item-01' | 'text-02' | 'svg-03',        // 自動編號
  type: 'rect' | 'ellipse' | 'line' | 'text' | 'image' | 'shape',
  x, y, w, h: number,                          // bbox（左上 + 寬高）
  rotation: number,                            // 旋轉角度
  flipH, flipV: boolean,                       // 翻轉
  opacity: 0~1,
  fill, stroke: '#RRGGBB' | 'transparent',
  fillEnabled, strokeEnabled: boolean,
  strokeWidth: number,
  strokeStyle: 'solid' | 'dash' | 'dot' | 'dashdot',
  shadow, sketch: boolean,
  locked: boolean,
  name: string,                                // 顯示於圖層列表
  
  // 文字相關
  text: string,
  fontFamily, fontWeight, fontStyle: string,
  fontSize: number,
  textDecoration: 'none' | 'underline' | 'line-through',
  textAlign: 'left' | 'center' | 'right',
  textVAlign: 'top' | 'middle' | 'bottom',
  textColor: '#RRGGBB',
  
  // Shape 專屬（用於形狀庫、匯入的複合 SVG）
  shapeId: string,
  shapeSvg: string,                            // 內層 SVG 字串
  shapeViewBox: { x, y, w, h },                // 用於座標映射
  preserveStyle: boolean,                      // 匯入時不覆寫原色
  
  // Image 專屬
  imgHref: string,                             // data:URL
  
  // 群組
  groupId: string | null,
  
  // Ghost（draw.io 匯入文字）
  ghostFor: { compoundId, foreignIndex } | null,
  useForeignObject: boolean,                   // 文字以 foreignObject 渲染
}
```

### State（全域狀態）
```js
const state = {
  objects: [],         // 物件陣列（順序＝圖層順序，尾為最上層）
  selected: new Set(), // 選取的 id 集合
  tool: 'select',      // 當前工具
  zoom: 1,             // 畫布縮放
  autoCounter: 0,      // 編號計數
  history: [],         // 歷史快照陣列
  historyIndex: -1,    // 當前指標
  clipboard: null,     // 樣式剪貼
  snapToGrid: false,
  gridSize: 10,
  smartGuides: [],     // 智慧對齊線（暫存渲染用）
  groupCounter: 0,
};
```

### History（歷史紀錄）
每筆紀錄包含完整 `state.objects` 的深拷貝快照：
```js
{
  action: '移動' | '縮放' | '編輯文字' | ...,
  meta: 物件名稱或附加說明,
  snapshot: [...deepClone(state.objects)],
  ts: Date.now(),
}
```
- 上限 50 筆，超過時 shift 最舊一筆
- Undo / Redo 透過 `historyIndex` 雙向移動

## 三、渲染管線

```
state.objects ──→ renderAll() ──→ layerRoot (svg <g>) 
                              ├── 每個 obj: renderObject(obj)
                              │            └── buildShape + buildTextNode
                              └── overlay: renderOverlay()
                                          ├── 群組外框
                                          ├── 智慧對齊輔助線
                                          ├── 選取框 + 8 個縮放點 + 旋轉點
                                          └── Marquee 框選矩形
```

### renderObject(obj)
產生一個 `<g data-id="...">` 包覆元素，套用 transform：
```
translate(cx cy) rotate(R) scale(sx sy) translate(-w/2 -h/2)
```
這層 transform 讓物件以中心為基準旋轉 / 翻轉，然後對齊到左上 (x, y)。

### buildShape(obj)
依 `obj.type` 分派：
- `rect / ellipse / line`：直接建立對應 SVG 元素
- `text`：建立透明 hit-test rect（讓 `<g>` 有命中區域）
- `image`：`<image>` 元素載入 imgHref
- `shape`：將 `shapeSvg` 字串以 `innerHTML` 注入 inner `<g>`，再做縮放對齊

### buildTextNode(obj)
- Ghost 物件（`obj.ghostFor`）：return null，視覺由 compound 提供
- 一般文字：建立 `<text>` 含 `<tspan>` 支援多行
- 進階模式（`obj.useForeignObject`）：以 `<foreignObject>` + HTML 渲染

## 四、Ghost 物件架構（v0.1.0 重設計）

針對 draw.io 匯入的最終解：

```
┌─────────────────────────────────────────────────┐
│ Compound Shape                                  │
│  - type: 'shape', shapeId: 'imported-svg'       │
│  - shapeSvg: 完整原始 SVG（含 foreignObject）    │
│  - preserveStyle: true（不覆寫顏色）             │
│  - 視覺由瀏覽器原生渲染 foreignObject 提供       │
└─────────────────────────────────────────────────┘
        ↑ 視覺
        │ 雙向綁定（TreeWalker 保留 HTML 結構）
        ↓ 文字內容
┌─────────────────────────────────────────────────┐
│ Ghost 文字物件 × N                              │
│  - type: 'text'                                 │
│  - ghostFor: { compoundId, foreignIndex }       │
│  - buildShape → 透明 hit-test rect              │
│  - buildTextNode → return null（無視覺）         │
│  - text: 從 foreignObject.textContent 抽取       │
└─────────────────────────────────────────────────┘
```

### 編輯流程
1. 使用者於右側 textarea 修改 ghost.text（或內嵌編輯器）
2. `updateCompoundForeignText(compoundId, foreignIndex, newText)`：
   - 用 `DOMParser({ "image/svg+xml" })` 在 SVG 命名空間解析 compound.shapeSvg
   - `querySelectorAll('foreignObject')[foreignIndex]` 定位目標
   - `TreeWalker.SHOW_TEXT` 走訪所有非空 text node
   - 第一個替換為新文字、其餘清空（保留 HTML 結構與樣式）
   - `XMLSerializer` 序列化回 compound.shapeSvg
3. `renderAll()` 重繪 → 畫面同步更新

### 為何必須用 DOMParser 而非 createElement('div')
HTML parser 將 SVG 元素小寫化：
- `<linearGradient>` → `<lineargradient>`
- `<clipPath>` → `<clippath>`

序列化回去後，`url(#mx-gradient-...)` 找不到漸層定義，整個 compound 變透明。
SVG 是 XML，case-sensitive，必須在 XML 命名空間下處理。

## 五、互動處理

### Pointer 流程
```
pointerdown ──→ hitTest(event.target)
              ├── kind: 'handle'    → 進入 resize / rotate 模式
              ├── kind: 'object'    → 進入 move 模式
              └── kind: 'empty'     → 進入 marquee 模式 / 建立模式

pointermove ──→ 依 drag.mode 派發：
              ├── move      → 套用智慧對齊吸附後更新位置
              ├── resize    → 套用 ratio-lock 後更新尺寸
              ├── rotate    → 計算角度差
              ├── create    → 預覽矩形
              └── marquee   → 即時更新框選範圍 + 即時選取物件

pointerup   ──→ commit + pushHistory
```

### 智慧對齊
`computeSmartSnap(movingIds, dx, dy, threshold)`：
1. 計算移動中物件的合併 bbox
2. 與其他物件比對左 / 中 / 右 與上 / 中 / 下共 6 條基準線
3. 距離 ≤ threshold 取最小者吸附
4. 同時產生粉紅輔助線資料供 overlay 渲染

### 群組
不另建 group 節點，採 flat `groupId` 標記：
- Ctrl+G：選取的物件全部設為同一 groupId
- Ctrl+Shift+G：清空選取物件的 groupId
- 點擊任一成員 → `expandSelectionByGroups()` 加入同 groupId 所有成員
- 圖層面板點擊不擴展（讓使用者能精準選取 ghost）

## 六、座標系統

### SVG ViewBox
固定 1200 × 800 為畫布基準，所有 obj.x / y / w / h 都在此座標系。

### 縮放
`stage.style.width / height` 直接乘以 `state.zoom`：
- viewBox 不變（內部座標固定）
- 元素的螢幕像素位置 = SVG 座標 × zoom + stageRect 偏移

### 點擊座標換算
`clientToSvg(clientX, clientY)` 使用 `stage.getScreenCTM().inverse()`：
- 不依賴 zoom 直接換算
- 自動處理捲動位移

### 智慧置中（centerOnObject）
1. 物件中心 SVG 座標 → 螢幕像素座標
2. 與 canvasHost 視覺中心比較
3. `canvasHost.scrollBy({ behavior: 'smooth' })` 平滑捲動

## 七、檔案 I-O

### 匯入
`importFile(file, idx, total)`：
- `.svg` → FileReader.readAsText → `importSvgString(svgStr, fileName, idx)`
- `.png / .jpg` → readAsDataURL → 新建 type='image' 物件

`importSvgString`：
1. DOMParser 解析根 `<svg>`
2. 讀取 viewBox 計算縮放比例（保留 5% 邊距）
3. 偵測 `<foreignObject>` 存在性
4. 若是 draw.io 格式 → 建立 compound + N 個 ghost
5. 否則 → 逐元素呼叫 `parseSvgElement` 建立獨立物件

### 匯出
`buildExportSvg()`：
1. 建立全新 `<svg>` 1200×800
2. 逐物件呼叫 `renderObject` 並 appendChild
3. `XMLSerializer.serializeToString`

### PNG 匯出
1. SVG 字串 → base64 data URL
2. 載入到 `<img>` 元素
3. `canvas.drawImage` → `canvas.toBlob`
4. 觸發下載

## 八、主題系統

### CSS Variables 切換
- `:root` 定義亮色變數
- `[data-theme='dark']` 覆寫變數
- JS 切換 `document.body.dataset.theme`

### 持久化
- `localStorage.setItem('svgeditor-theme', ...)`
- 啟動腳本（在 `<head>` 內）先讀 localStorage，無紀錄時偵測 `prefers-color-scheme`，避免閃現

### 主題自適應形狀
- 形狀庫 SVG 使用 `currentColor` 作為 stroke
- 透過 `.shape-item svg { color: var(--text-main); }` 繼承
- 亮暗主題下形狀皆清晰可見

## 九、依賴清單
- **無** JavaScript 框架
- **無** CSS 框架
- **無** 套件管理
- 唯一外部資源：Google Fonts（Inter + Noto Sans TC）

可完全離線運作（移除 Google Fonts 連結即可）。
