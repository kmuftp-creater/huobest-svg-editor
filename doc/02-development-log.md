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

## 九、打包工具的詭異 bug（v0.1.2）

### 使用者反饋
單檔版 `svg-editor.html` 開啟後「開啟」按鈕沒反應、其他按鈕也都失效。

### Root Cause
`build.js` 用 `String.prototype.replace(regex, replacementStr)` 內聯 app.js。replace 的第二參數是**字串**時，JavaScript 把替換字串中的特殊字元解讀為正則回溯：

| 字串 | 解讀為 |
|---|---|
| `$$` | 字面 `$`（吃掉一個） |
| `$&` | 整段匹配 |
| `` $` `` | 匹配之前的文字 |
| `$'` | 匹配之後的文字 |
| `$n` | 第 n 個分組 |

app.js 內有 14 處 `$$`（querySelectorAll 短記法 `const $$ = sel => ...`），全部被吃成 `$`：
- `const $$ = ...` → `const $ = ...`（覆寫原本的 `$`）
- `$$('.tool').forEach(...)` → `$('.tool').forEach(...)`（querySelector 不回傳陣列）
- 第一個 `.forEach is not a function` 例外中斷整個 IIFE

所有後續事件綁定（包括「開啟」按鈕）都未執行 → 整個應用「死寂」。

### 修正
build.js 改用 replace 的**函式回呼**形式：
```js
.replace(regex, () => replacementStr)  // 回呼回傳的字串不會被解讀特殊字元
```
加入「`$$` 個數一致」驗證，避免未來再次踩到。

### 教訓
**處理使用者代碼時，避免 `String.prototype.replace` 的字串第二參數。** 永遠用函式回呼或 `String.prototype.replaceAll`（仍需 ES2021+）。

## 十、畫布捲動 & ghost 跟隨（v0.1.3）

### 反饋 1：放大後左側被吃掉
flex `justify-content: center` 在子元素超過容器時，**start 端不可達**（捲動條卡在 0 但內容已被推出視窗）。

### 修正
```css
align-items: safe center;
justify-content: safe center;
```
`safe` 關鍵字：放得下時置中、超出時降為 start 對齊。

### 反饋 2：compound 縮放時 ghost 不跟隨
compound shape 縮放時，內部 foreignObject 跟著 compound 變形（瀏覽器原生渲染），但獨立的 ghost 物件位置不變 → 視覺與 hit-test 區域脫鉤。

### 修正
- pointerdown 時 `captureGhostsForCompounds` 記錄所有 ghost 原始狀態
- pointermove (move) 套用相同 dx, dy
- pointermove (resize) 計算 sx, sy 對 ghost 相對位置與字級等比變換

## 十一、拆解匯入功能演進（v0.2.0 ~ v0.2.4）

### v0.2.0 — 初版實作
反饋：「圖層只有 svg-XX + N 個 text-XX，個別形狀不能單獨操作」。

新增「拆解匯入」按鈕：把 compound 展開為 N 個獨立物件（rect / ellipse / path / text）。

同時補：
- Ghost 選取時隱藏縮放控點（紫色虛線框 + 不顯示 handle）
- 文字 `\n` 換行：用 `<br>` 元素注入 foreignObject

### v0.2.1 — 拆解後排版補強
拆解後文字（單行 SVG `<text>`）長中文句溢出。改用 `useForeignObject: true`，HTML word-wrap 自動換行。

新增「對齊文字至圖形」按鈕：找出每個 text 中心點所在的最緊密形狀，自動對齊 bbox。

### v0.2.2 — 找回失蹤的文字
反饋：拆解後「跟進解法」標題消失。

Root cause：draw.io 對**粗體 / 大字級標題**使用原生 SVG `<text>` 而非 foreignObject 渲染：
```html
<g fill="#FF8000" font-family="Tahoma" font-weight="bold" font-size="60px">
  <text x="1204" y="822">跟進解法</text>
</g>
```

原本 `decomposeCompound` 只處理 foreignObject，這些原生 text 被遺漏 → compound 移除後文字徹底消失。

修正：新增 `querySelectorAll('text')` 處理迴圈，繼承父層 `<g>` 的 font / fill / text-anchor 屬性，累積父層 translate transform，將 baseline 錨點換算為 bbox 左上座標。

附帶 UX 改進：選取 ghost 後按拆解匯入，自動找到所屬 compound 直接拆解。

### v0.2.3 — 對齊不過度縮小
反饋：對齊後文字被裁切。

Root cause：原邏輯預設 shape 比 text 大很多、padding 取 6%。但 draw.io 內 shape 與 foreignObject 尺寸常幾乎相同，6% padding (寬高各減 12%) 把 bbox 縮小後文字裝不下 → `overflow:hidden` 裁切。

修正：padding 6% → 2%，bbox 高度取 max(shape 內部高, 文字需求高)。

### v0.2.4 — 終極解：自動縮字級
反饋：「拆解後文字變大，封裝沒有縮小」。

Root cause（兩層）：
1. `decomposeCompound` 兩處 `Math.max(6, fontSize × scale)` 把 4.5 px 小字硬拉到 6 px（+33%），原本能容納的文字裝不下
2. 「對齊文字至圖形」未調整字級，shape 變小時文字溢出

修正：
1. 字級下限 6 → 3，精確保留原始視覺尺寸
2. 「對齊文字至圖形」改為實測 + 縮字級：
   - `measureForeignTextHeight`：用隱藏 div 鏡像 foreignObject CSS（line-height、padding、word-break）實際渲染後讀 `offsetHeight`
   - `findFittingFontSize`：先用目前字級測量；若超過 bbox 高，二分搜尋（最多 14 次迭代、精度 0.25 px）找出能完整裝進的最大字級
3. bbox 嚴格等於 shape 內部，字級縮小確保不裁切（不放大）

### 教訓
- **不要靠估算公式預測 HTML 文字渲染尺寸**，實測才準確
- **字級下限要保守**（原本 6 px 看似合理但對小型 SVG 已過大）
- **複合修正要驗證**：v0.2.3 看似修了卻沒修，因為沒解決字級膨脹的根因

## 十二、UX 收尾（v0.2.5 ~ v0.2.6）

### v0.2.5
反饋：
- 說明 Modal 沒有「調整」面板的功能說明
- 文字內容 textarea 太小
- 部分 UI 還是英文（Auto / Convert labels to SVG / Snap to Grid / Explore）
- 形狀庫預設展開三個分類太多
- 預設亮色不符合使用情境
- 「符合」按鈕變直書

修正：
- 說明 Modal 加入「調整面板功能」整段（5 個子段落）
- textarea min-height 64 → 140
- 全面中文化（Auto → 自動、Convert → 將文字轉為向量、Snap → 對齊網格、Explore → 瀏覽模式、Text → 文字、Heading → 標題）
- 形狀庫只展開「一般」（其他預設收摺）
- 預設改為暗色主題（不再隨 OS 偏好）
- 「符合」直書修正：`.zoom-controls .tool { width: auto; padding: 0 10px; white-space: nowrap; }`

### v0.2.6 — 補漏
反饋：物件樣式面板的 `Sketch` 沒翻。

修正：`Sketch` → `草圖`。

## 十三、踩過的坑（更新版）

| 問題 | 嘗試方案 | 結果 | 最終解 |
|---|---|---|---|
| draw.io 文字看不到 | 抽取 foreignObject 內容成獨立物件 | 文字溢出 bbox | Ghost + 保留 compound 內 foreignObject |
| 文字重疊 | widthBoost 放大 bbox | bbox 互相侵入 | 不放大，接受小字級 |
| 文字編輯失效 | — | text 物件沒命中區 | 加透明 hit-test rect |
| 編輯後畫面消失 | createElement('div') 解析 SVG | gradient 元素小寫化 | DOMParser + image/svg+xml |
| Textarea 失焦 | renderAll 後重設 value | 游標重置 | 檢查 activeElement、debounce 重序列化 |
| 單檔版按鈕無反應 | `String.replace(re, str)` 內聯 | `$$` 被吞 → IIFE 中斷 | replace 改用函式回呼 |
| 放大後左側不可達 | flex `justify-content: center` | start 端被推出視窗 | `safe center` 關鍵字 |
| compound 縮放 ghost 不跟 | 預設物件獨立 | 視覺與 hit-test 脫鉤 | drag 起始時捕捉 ghost 原始狀態，move/resize 同步變換 |
| 拆解後「跟進解法」消失 | 只處理 foreignObject | 漏掉原生 `<text>` | 額外 querySelectorAll('text')，繼承父層樣式 |
| 對齊後文字裁切 | padding 6% 一律縮 bbox | 文字裝不下 | padding 2%、bbox 高度動態決定 |
| 拆解後文字變大 | `Math.max(6, ...)` 拉高字級 | 文字溢出 | 字級下限改 3、對齊時實測 + 二分縮字級 |
| 「符合」直書 | `width: 32px` 容不下 2 字 | 瀏覽器拆行 | 縮放列按鈕 `width: auto; nowrap` |

## 十四、範本系統演進（v0.3.0 ~ v0.7.1）

### v0.3.0 — 初版範本（內建程式碼產生）
左側面板新增「範本」分頁，與「圖形」並列。6 個內建範本：
- 組織架構圖、水平流程、判斷流程、時間軸、四象限、SWOT、甘特圖

每個範本以 `build()` 函式回傳物件陣列（type / x / y / w / h / text / fill / stroke 等）。

### v0.3.1 — 範本擴充至 14 個
依使用者建議新增 8 個複雜範本：UML 類別圖、泳道圖、家族族譜、行業分類、年度規劃、心智圖、5W1H、甘特圖。

同時色卡從 8 色擴充為 24 色，採 8 色相 × 3 亮度結構，消除原本 8 色過度近似的問題。

### v0.4.0 — Connector 系統（節點自動連線）
依使用者提供的「功能」資料夾截圖（心智圖工具列），實作節點自動關聯：

```js
{
  type: 'connector',
  fromId: 'item-01',
  toId: 'item-02',
  text: '關係',
  arrowEnd: true,
}
```

**動態錨點演算法**：每次渲染時取 from 邊界上「最接近 to 中心」的點，自動選邊（上 / 下 / 左 / 右）。物件移動或縮放時下次 renderAll 即重新計算。

工具列新增四個按鈕：下級節點（Tab）、同級節點（Enter）、上級節點（Shift+Tab）、關係線（F4）。

物件刪除時所有相關 connector 自動清除。

### v0.5.0 失敗：自製範本品質持續不穩

連續嘗試三輪修正心智圖、年度規劃、5W1H 等範本的「對角連線穿過形狀」問題：
- v0.4.x：寫程式碼產生範本，但連線連 center-to-center 直接穿過形狀
- v0.5.1：修正 line 渲染（加入 lineX1/Y1/X2/Y2），對角線方向正確但仍穿過形狀本體
- 累積嘗試後察覺**根本問題**：「程式碼產出範本」這條路本質上有上限 —— 我看不到結果只能盲寫座標

### v0.6.0 — 範本系統重構（兩條策略並行）

**使用者誠實反饋後**（「自製範本品質越改越糟」），我做了根本性的策略轉換：

**策略 C — 13 個專業 SVG 範本（使用者提供）**
- 新增 `generate-templates.js` 腳本：讀取 `範本/new/*.svg`
- 自動為 CSS 類名加上範本 id 前綴（如 `.title` → `.svg-pmp-title`），避免多範本同時載入時樣式衝突
- 輸出 `templates-data.js`（127 KB）
- 套用時包成 compound shape（type=shape，preserveStyle=true），自動縮放至 1200×800 並置中

**策略 A — 使用者可儲存自訂範本**
- 頂部「儲存範本」按鈕（v0.6.0 初版：僅下載 JSON 檔）
- 拖入 JSON 自動還原 + 重新分配 ID

**下架 8 個低品質舊範本**：組織架構、家族族譜、行業分類、UML、泳道、心智圖、年度規劃、5W1H

### v0.6.1 — 拆解 SVG 範本 + CSS 樣式保留

兩個 bug 修正：
1. `doDecompose` 只認 `shapeId === 'imported-svg' / 'imported'`，新 SVG 範本用 `'svg-template'` 被排除
2. 拆解後個別元素失去 `<style>` 上下文，CSS class 不再生效

**關鍵技術**：拆解時把 compound.shapeSvg 暫時掛到隱藏 DOM SVG，呼叫 `window.getComputedStyle(el)` 讀取每個元素的計算 fill / stroke / fontSize / fontFamily / fontWeight / textAnchor，套用為 inline 屬性。

### v0.7.0 — 完整自訂範本管理（localStorage 持久化）

使用者再次反饋「v0.6.0 的『儲存範本』只下載 JSON，不算完整功能」。本版重新實作：

**儲存**：
- `localStorage` key: `svgeditor-custom-templates`
- 同名自動覆蓋（保留 id 與 createdAt，更新 updatedAt）
- 自動產生縮圖（從 state.objects 渲染壓縮 SVG）

**管理 UI**：
- 範本面板分區顯示「自訂範本 (N)」+「內建範本 (N)」
- 自訂範本 hover 顯示 ✎改名 / ⇩匯出 JSON / ×刪除

**載入**：
- 點縮圖套用至畫布
- 重新指派 ID 避免衝突
- 修正 connector / ghost 引用

### v0.7.1 — AI 工具分類更新為 2026 版

使用者重新設計兩版（2500×1400 與 2700×1500），選用較寬鬆的 2026 版。同時新增 `SKIP_FILES` 機制讓舊版檔案保留於資料夾備份但不收錄。

修正 SVG 範本 ID 衝突：之前 13 個中 8 個 id 都是 `svg-svg`（檔名是中文，剝除非英數後只剩 'svg' 後綴）。改用 `tpl-{index}-{hint?}` 確保唯一。

## 十五、自製範本失敗的反思

從 v0.4.0 到 v0.5.x 我寫了 8 個複雜範本，最後全部下架。失敗原因：

1. **盲寫**：寫程式碼時看不到結果，憑想像放座標。每輪都有意外。
2. **錯用工具**：用 `_line(centerX1, centerY1, centerX2, centerY2)` 直接連兩個形狀的中心。線當然穿過形狀。
3. **沒用 connector**：v0.4.0 已有自動錨點機制，但範本內完全沒用，反而退化為原始直線。
4. **canvas 太小**：1200×800 容不下複雜布局，硬擠就變醜。

**教訓**：
- 不要在錯誤前提上修補（自繪複雜佈局本身就是錯的前提）
- 接受工具的限制，改用合適的工具（用編輯器拖拉設計 / 使用者提供 SVG）
- 使用者一句話勝過工程師十次嘗試（v0.6.0 突破來自使用者誠實反饋）

## 十六、技術心得（v0.3 ~ v0.7）

### SVG 渲染深度
- 直角座標、viewBox、transform、preserveAspectRatio 的交互
- `<defs><style>` 全域作用域問題 → 必須做 class 範圍化
- foreignObject vs 純 SVG `<text>` 各自的適用場合
- `getComputedStyle` 是把 CSS 套用結果拿出來的最佳工具

### 物件模型設計
- 「ghost 物件」處理視覺 / 編輯分離
- 「connector 物件」用 fromId/toId + 動態計算實現自動跟隨
- 「frame 物件」可作為視覺分組標記
- 自訂範本用 localStorage 持久化，跨 session 保存

### 程式碼產出 vs 視覺工具
- 程式碼能精確生成簡單規則排版（流程、矩陣、表格）
- 但複雜視覺佈局（心智圖、組織圖、概念圖）必須靠視覺工具
- 解法：讓編輯器本身能儲存設計成果為範本

## 十七、未實作但 PRD 提及（後續排程）
- Google Fonts 雲端整合
- PWA 離線支援
- 路徑節點 > 1000 時切 Canvas 渲染
- 完整鋼筆工具（錨點 + 把手編輯）
- 連線樣式切換按鈕（直線 / 折線 / 曲線）
- 拖曳連線端點重接其他節點

詳見 `05-roadmap.md`。

## 十五、整體開發節奏觀察

從 v0.0.1 到 v0.2.6 共 **20 個版本**、約 **60 個任務**。可分為三個階段：

| 階段 | 版本 | 主軸 | 關鍵突破 |
|---|---|---|---|
| **建構期** | v0.0.1 ~ v0.0.5 | 從零搭起 MVP + 第一輪 UX | 三大屬性面板、初步 draw.io 支援 |
| **困難期** | v0.0.6 ~ v0.0.8 | 文字溢出三連敗 | 連續三版本嘗試自繪文字失敗，逼出架構重設計需求 |
| **架構期** | v0.1.0 ~ v0.1.3 | Ghost 物件架構落地 | 接受「無法重繪 foreignObject」前提，視覺與編輯解耦 |
| **功能期** | v0.2.0 ~ v0.2.6 | 拆解 / 對齊 / 中文化 / 部署 | 真正可用的編輯能力 + 上線 |

### 反思
1. **使用者一句話勝過工程師十次嘗試**：v0.1.0 的關鍵突破來自使用者一句「之前版本文字都在框內」。
2. **不要在錯誤前提上修補**：v0.0.6 ~ v0.0.8 三次嘗試都失敗，因為前提「自繪 foreignObject 內容」本身錯誤。
3. **實測勝過估算**：v0.2.4 把字級估算改為實測，一次到位。
4. **小細節影響大體驗**：v0.2.5 ~ v0.2.6 全是 UX 收尾（中文化、暗色、按鈕直書），但這些是使用者直接感受的差異。
