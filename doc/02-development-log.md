# 開發歷程與決策紀錄

完整記錄此專案從零到 v0.1.1 的演進、踩過的坑、做過的取捨。

## 一、起點（v0.0.1）

### 需求輸入
- PRD：霍家私塾 SVG 編輯器，採三大屬性面板（物件樣式 / 文字 / 調整）
- 設計參考：image0~image6.png 七張 UI 截圖
- 測試素材：兩個 draw.io 匯出的繁體中文流程圖 SVG（87 KB，2968×1538）

### 初版策略
直接以三檔（HTML / CSS / JS）建構，無框架依賴：
- 為日後打包單檔保留彈性
- 無 build step，雙擊 HTML 即可執行
- 對應 PRD 中「即時渲染引擎」要求

### 初版完成項目
- 完整 DOM 骨架（Header / 左形狀庫 / 中央畫布 / 右屬性面板 / Footer）
- 設計系統（CSS Variables、亮暗主題、Pill 按鈕、12px 卡片圓角）
- 形狀庫 6 大分類（共 65 個）
- 三大屬性面板雙向綁定
- 歷史紀錄（50 筆深拷貝快照）
- SVG / PNG 匯入匯出
- 範例流程圖示範

### 設計師視角的自評
完成度高，但缺少向量編輯器基本功：對齊輔助線、框選、群組、Pen 工具。
打了自評分 65 / 100。

## 二、第一輪改進（v0.0.2 - 0.0.3）

### 使用者反饋
- 暗色模式下左側形狀圖示「看不到」
- 拖入流程圖範本後文字看不到（要正常讀取中文）
- 大型 SVG 超出畫布範圍

### 修正
1. 形狀庫所有 `stroke="#333"` 改為 `stroke="currentColor"`（依主題變色）
2. 預設主題由系統 `prefers-color-scheme` 決定 + localStorage 持久化
3. SVG / PNG 匯入自動依 viewBox 縮放至畫布（保留 5% 邊距）
4. **第一次處理 draw.io 格式**：偵測 `<foreignObject>` 後改用「複合 shape + 抽取文字標籤」雙軌（v0.0.2 設計）

### 第二輪需求（功能擴充）
1. 新增一鍵清除按鈕
2. 開啟時不要預設畫面
3. 新增畫布拖拉功能
4. 我建議的前三項：智慧對齊、框選、群組

### 對應實作
- 清除按鈕：有確認、可 Undo
- 移除 `seedDemo()`
- 手型工具（H 快捷鍵 + 工具列圖示）+ Space 拖曳保留
- **智慧對齊（Smart Guides）**：拖曳時與其他物件邊界 / 中線比對，6px 內吸附並顯示粉紅虛線
- **框選（Marquee）**：空白處拖曳出虛線矩形，框內物件即時選取
- **群組**：以 `groupId` 標記實作扁平群組（非樹狀），Ctrl+G / Ctrl+Shift+G

## 三、文字編輯失效（v0.0.4）

### 使用者反饋
- 文字無法編輯
- 「佈景主題」、「匯入 PNG」、預設色卡下方小點看起來沒用，移除
- SVG 編輯器下方副標題「霍家私塾 v0.1.12」移除
- 系統版本更新為 0.0.4

### Root Cause 排查
雙擊文字物件無反應 → 排查發現：
1. `text` 類型的 `buildShape` 回傳 `null`（無形狀）
2. `buildTextNode` 對 `<text>` 元素加上 `pointer-events="none"`（避免文字影響其他互動）
3. 結果：整個 `<g>` 無命中區域，無法觸發 dblclick

### 修正
- 為 text 類型在 `buildShape` 中加入「透明 hit-test rect」
- `opacity === 0` 的 `<g>` 加上 `pointer-events="none"` 避免遮蔽下層
- 內嵌編輯器字級乘上 state.zoom 避免縮放下錯位
- `setTimeout` 延遲 focus 避免被 pointerup 搶走
- 加入 IME 組字防呆（`!ev.isComposing`）
- `committed` 旗標避免 blur 與 Escape 重複移除元素

### UI 清理
- 移除 brand-sub、匯入 PNG 按鈕、佈景主題分頁、preset-dots

## 四、結構整併（v0.0.5）

### 使用者反饋
- 點圖層應自動置中該圖層
- 圖層 / 歷史紀錄改放右側面板下方
- 「內容　數值」鍵值區沒必要，移除
- 新增文字編輯區（textarea），避免在畫布上反覆對位點選

### 實作
- **centerOnObject**：物件中心 SVG 座標 → 螢幕座標 → `canvasHost.scrollBy({ behavior: 'smooth' })`
- 加上 0.8 秒藍光暈閃爍動畫
- 移除浮動 float-panel，於右側面板新增固定底部分頁（圖層 / 歷史紀錄）
- 移除 kv-list 與相關 CSS
- 文字 Tab 頂部新增大型 textarea：
  - 即時雙向綁定 obj.text
  - input 即時更新、change（失焦）寫歷史
  - `activeElement` 檢查避免 renderAll 搶走焦點
  - stopPropagation 阻擋全域快捷鍵

## 五、文字重複（v0.0.6）

### 使用者反饋
- 點圖層上的文字，畫面上會多出一條一模一樣的文字
- 選文字物件時右側面板應自動跳到「文字」分頁
- 左側形狀庫有重複
- 鋼筆工具沒功用，移除
- 版號 0.0.6，後續規則：bug fix +0.0.1、新功能 +0.1.0

### Root Cause（重複文字）
v0.0.5 的 draw.io 匯入策略：
- compound shape 保留完整 SVG（含 foreignObject 文字）
- 額外建立 N 個獨立可編輯文字標籤，opacity = 0 隱藏
- layer click 強制 opacity = 1 → 文字物件浮現，與 compound 內 foreignObject 重疊

### 修正方案 A（當時採用）
- 匯入時把 compound 內所有 foreignObject **剝除**：`cleanedRoot.querySelectorAll('foreignObject').forEach(fo => fo.remove())`
- 文字標籤改為 opacity = 1（可見），成為唯一文字來源
- layer click 不再強制變更 opacity

### 形狀庫去重（65 → 51）
- 基本圖形：移除 square（= 一般.rect）
- 流程圖：只保留 7 個獨有形狀（移除 process / decision / terminator / data / document / preparation / connector）
- 實體關係：只保留 4 個獨有（移除 entity / relation / attribute）
- UML：只保留 5 個獨有（移除 note / usecase / state）

### 自動切換分頁
新增 `autoSwitchPropTab(obj)`：選 text 類型 → 切「文字」分頁，其他不打擾。

## 六、文字溢出地獄（v0.0.7 - 0.0.8）

### 使用者反饋
- 文字浮在框外（v0.0.6 修正後新問題）

### Root Cause（文字溢出）
v0.0.6 剝除 compound 內 foreignObject 後，要靠獨立文字標籤呈現文字。但：
- 原始 foreignObject 寬度只有 72px，內含 HTML 自動換行的 5 行中文
- 我把文字抽出成單行 `<text>` + `text-anchor="middle"`
- 30+ 字長句單行渲染（300px 寬）置中在 72px 框內 → 左右各超出 130+px
- 沒有 clip，到處散布

### v0.0.7 嘗試（失敗）
改用 `<foreignObject>` + flex div 渲染文字標籤，HTML 自動換行：
- 加 `widthBoost = 1.67` 補償 8px 字級下限導致的字寬增加
- 結果：bbox 等比放大 1.67 倍 → 相鄰標籤的 bbox **互相侵入**
- 視覺上像 A 框的文字跑進 B 框

### v0.0.8 嘗試（仍失敗）
- 移除 widthBoost
- 字級下限降至 6px
- 雙層 clip（foreignObject + div 都加 overflow:hidden）
- 估算高度自動展開（最多 4 倍原高度）
- 結果：仍有少量重疊。**Fundamental 問題：自繪文字永遠無法 100% 還原 draw.io 的 HTML 排版細節**

### v0.1.0 架構重設計：Ghost 物件
使用者一針見血提示：「之前的版本雖然畫面上多出一條，但文字都在框內」。

回到 v0.0.5 的視覺策略 + 解決重複：
- compound 保留完整 foreignObject（瀏覽器原生渲染，100% 還原）
- 文字物件改為 **Ghost**：
  - `obj.ghostFor = { compoundId, foreignIndex }`
  - `buildTextNode` 對 ghost return null（無視覺）
  - `buildShape` 提供透明 hit-test rect（可點選）
- 編輯時雙向綁定：ghost.text 變更時，定位 compound.shapeSvg 內第 N 個 foreignObject，TreeWalker 替換 text node 內容（保留 HTML 結構）

### 為何這是正確架構
1. 視覺：100% 來自原始 SVG，無需自己重繪
2. 編輯：ghost 提供 hit-test 區域與 textarea 介面
3. 同步：TreeWalker 只替換 text node，保留 font / color / text-align 等樣式

## 七、命名空間污染（v0.1.1）

### 使用者反饋
- 編輯文字後，整個畫面內容都不見了

### Root Cause
`updateCompoundForeignText` 使用 `document.createElement('div')`（HTML 命名空間）解析 compound.shapeSvg：
- HTML parser case-insensitive
- `<linearGradient>` → `<lineargradient>`
- `<clipPath>` → `<clippath>`

序列化回去後，所有使用 `url(#mx-gradient-...)` 的填色找不到對應定義 → 元素變透明 → 整個 compound「消失」。

### 修正
改用 `DOMParser({ "image/svg+xml" })` + `XMLSerializer`：
```js
const wrapped = `<svg xmlns="${SVG_NS}" ...>${compound.shapeSvg}</svg>`;
const doc = new DOMParser().parseFromString(wrapped, 'image/svg+xml');
// ... modify ...
const serializer = new XMLSerializer();
// 序列化時跳過外層 svg
let html = '';
for (const child of Array.from(root.childNodes)) {
  html += serializer.serializeToString(child);
}
compound.shapeSvg = html;
```

並加入 80ms debounce 避免 80KB+ 大型 SVG 在每鍵打字時全量重序列化造成卡頓。

## 八、關鍵學習

### 1. SVG vs HTML 命名空間
- SVG 是 XML，case-sensitive
- HTML 是 SGML 衍生，case-insensitive 且容錯
- 用 HTML parser 處理 SVG 會丟失大小寫、混淆元素類型
- 規則：**處理 SVG 字串永遠用 DOMParser + image/svg+xml**

### 2. foreignObject 的特性
- SVG 內嵌 XHTML 的官方機制
- 內容 namespace 為 XHTML，外層為 SVG
- 視覺由瀏覽器原生 HTML 引擎渲染，無法在 SVG 引擎內完美重繪
- 任何「重繪 foreignObject 內容」的嘗試都會失真

### 3. Ghost 物件模式
- 將「視覺」與「互動介面」分離
- 視覺由現成元件提供，互動透過旁路物件處理
- 雙向綁定：互動修改傳回視覺源
- 適用於：難以重繪但需要編輯的內容

### 4. 漸進優化的價值
- v0.0.6 → v0.0.7 → v0.0.8 三輪嘗試自繪文字都失敗
- 直到 v0.1.0 接受「無法重繪」這個前提才找到正確解
- 教訓：當連續多次修正同一問題都失敗時，root cause 通常在「假設」層級而非「實作」層級

### 5. 使用者反饋的價值
- v0.1.0 的關鍵突破來自使用者提示：「之前的版本文字都在框內」
- 提醒：「曾經正確的」狀態值得保留並基於它改進，而非全盤重來

## 九、踩過的坑（紀錄供未來避免）

| 問題 | 嘗試方案 | 結果 | 最終解 |
|---|---|---|---|
| draw.io 文字看不到 | 抽取 foreignObject 內容成獨立物件 | 文字溢出 bbox | Ghost + 保留 compound 內 foreignObject |
| 文字重疊 | widthBoost 放大 bbox | bbox 互相侵入 | 不放大，接受 < 8px 字級 |
| 文字編輯失效 | — | text 物件沒命中區 | 加透明 hit-test rect |
| 編輯後畫面消失 | createElement('div') 解析 | gradient 元素小寫化 | DOMParser + image/svg+xml |
| Textarea 失焦 | renderAll 後重設 value | 游標重置 | 檢查 activeElement、debounce 重序列化 |

## 十、未實作但 PRD 提及（後續排程）
- Google Fonts 雲端整合
- PWA 離線支援
- 路徑節點 > 1000 時切 Canvas 渲染
- 完整鋼筆工具（錨點 + 把手編輯）

詳見 `05-roadmap.md`。
