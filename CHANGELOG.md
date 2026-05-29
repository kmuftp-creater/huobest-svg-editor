# 變更紀錄 — 霍家私塾 SVG 編輯器

## 版本規則
- **Bug fix（修正）**：第三碼 +1（例：`0.0.5` → `0.0.6`）
- **新增功能**：第二碼 +1，第三碼歸 0（例：`0.0.6` → `0.1.0`）
- **重大架構變更**：第一碼 +1，後兩碼歸 0（例：`0.1.0` → `1.0.0`）

---

## v0.7.1（當前）
### 改進
- **AI 工具分類心智圖更新為 2026 版**：使用者重新設計後提供兩個版本（2500×1400 與 2700×1500），選用較寬鬆的 2026 版（避免遮蔽物件問題）。舊版檔案保留於 `範本/new/` 作為備份，透過 `SKIP_FILES` 跳過不收錄至範本庫。
- generate-templates.js 新增 SKIP_FILES 機制：未來如需淘汰其他範本，加入清單即可，原始檔保留不刪除

## v0.7.0
### 新功能：完整自訂範本管理（localStorage 持久化）
依使用者確認「儲存範本」目前僅下載 JSON 不算完整功能，本版重新實作為**真正可管理的自訂範本系統**：

**儲存範本**
- 頂部「儲存範本」按鈕 → 輸入名稱 → 寫入 `localStorage`（key: `svgeditor-custom-templates`）
- 同名範本自動覆蓋（保留原 id 與建立時間，新增 updatedAt 戳記）
- 自動產生縮圖（從目前 state.objects 渲染壓縮 SVG 預覽）

**範本面板分區**
- 自訂範本顯示在最上方（含「自訂範本 (N)」分區標題）
- 內建範本顯示在下方（含「內建範本 (N)」分區標題）
- 自訂範本 hover 時顯示三個管理按鈕：
  - ✎ 改名
  - ⇩ 匯出 JSON 備份（離線保存 / 分享）
  - × 刪除（含確認對話框）

**載入流程**
- 點自訂範本縮圖 → 套用至畫布（重新指派 ID 避免衝突，同步修正 connector/ghost 引用）
- 也可從「開啟」按鈕匯入舊版 JSON 備份檔

### 修正
- **SVG 範本 ID 衝突**：之前 13 個 SVG 範本中 8 個 id 都是 'svg-svg'（檔名為中文時剝除非英數後只剩 'svg' 後綴）。改為以 index 為主、英數摘要為 hint：`tpl-{index}-{hint?}`，13 個範本全部唯一。
- **依使用者要求下架「聊天溝通教學」範本**：新 id `tpl-12` 已加入 OBSOLETE 清單；過濾邏輯移到 SVG 範本載入之後，確保下架生效。

### 範本總數
- 內建：6（簡單範本）+ 12（專業 SVG，扣除聊天教學）= **18 個**
- 自訂：依使用者儲存數量（無上限，受 localStorage 容量約 5 MB 限制）

## v0.6.1
### 修正
- **拆解按鈕對 SVG 範本無反應**：root cause 是 `doDecompose` 只認 `shapeId === 'imported-svg' / 'imported'`，但 v0.6.0 新增的專業 SVG 範本用 `shapeId === 'svg-template'`，被過濾掉導致按鈕無反應。**修正**：加入 `svg-template` 至辨識清單。
- **拆解後 CSS class 樣式遺失（顏色 / 字型變預設）**：SVG 範本透過 `<defs><style>` 定義樣式（`.title { fill: #333 }`），拆解後個別元素失去 `<style>` 上下文，CSS 不再生效。**修正**：拆解時將 compound.shapeSvg 暫時掛到隱藏的 DOM SVG 內，用 `window.getComputedStyle(el)` 讀取每個元素的計算 fill / stroke / fontSize / fontFamily / fontWeight / textAnchor，套用為 inline 屬性至拆解後的物件，再移除隱藏節點。
- 計算 strokeWidth 時依 compound 縮放比例同步換算

## v0.6.0
### 重大改進：範本系統重構
依使用者回饋「自寫範本品質不穩定」的事實，本版採取兩條互補策略徹底解決：

#### 策略 C：13 個專業 SVG 範本（取代品質不佳的內建範本）
- 新增 `generate-templates.js` 腳本：讀取 `範本/new/*.svg` 13 個專業設計的 SVG 檔
- 自動為 CSS 類名加上範本 id 前綴（如 `.title` → `.svg-pmp-title`），避免多範本同時載入時樣式衝突
- 輸出 `templates-data.js`（126.5 KB），含 13 個範本的完整 SVG 內容
- 套用時包成 compound shape，自動縮放至畫布並置中
- **新範本清單**：
  - 結構：專案成員結構、部門成員結構、台灣家族族譜
  - 流程：粉彩流程圖、客服處理泳道圖
  - 心智圖：高雄景點推薦、AI 工具分類、PMP 十大領域
  - 矩陣：商業模式畫布
  - 分析：6M 魚骨圖
  - 時序：時間軸分析法
  - UML：課程平台使用案例
  - 思考：聊天溝通教學

#### 策略 A：使用者可儲存目前畫布為自訂範本
- 頂部工具列新增「儲存範本」按鈕
- 把目前 `state.objects` 序列化為 JSON 並下載
- 支援拖入 JSON 檔自動還原為畫布內容（並重新分配 ID 避免衝突）
- 自動修正 connector / ghost 的 ID 引用
- **使用者可在編輯器內手動設計範本 → 存檔 → 日後拖回使用**

#### 下架的舊範本
品質不佳或已被 SVG 取代：
- 組織架構圖（→ 專案成員結構 / 部門成員結構）
- 家族族譜（→ 台灣家族族譜）
- 行業分類（連線品質不佳，無對應 SVG 暫時下架）
- UML 類別圖（→ 課程平台 UML）
- 泳道圖（→ 客服處理泳道圖）
- 心智圖（→ 三個專業心智圖範本）
- 個人年度規劃（連線品質不佳，暫時下架）
- 5W1H 分析（連線品質不佳，暫時下架）

#### 保留的舊範本（仍可用）
- 水平流程、判斷流程、時間軸、四象限、SWOT、甘特圖

#### 結果
範本總數：14 → **19 個**（6 個內建簡單範本 + 13 個專業 SVG）
所有範本視覺品質有保證（要嘛是手寫的簡單範本，要嘛是專業 SVG 原檔）

## v0.5.1
### 修正（關鍵）
- **範本對角 / 垂直連線變成水平短線（根本問題）**：root cause 是 `buildShape` 對 `type='line'` 永遠畫 `(0, h/2) → (w, h/2)` 的水平線。範本中大量 `_line(parentX, parentY, childX, childY)` 用於繪製樹狀連接，被強制變成水平短線。**所有受影響範本**：行業分類、年度規劃、心智圖、5W1H、家族族譜、組織架構圖、時間軸、UML 等。
- **修正**：line 物件加入 `lineX1 / lineY1 / lineX2 / lineY2`（相對 bbox 的端點座標），渲染時優先使用。L 工具建立直線時自動帶入起終點座標，可繪製任意方向直線。

### 新功能：外框（Ctrl + Alt + B）
- 工具列新增「外框」按鈕（虛線方框圖示）
- 選取一或多個物件後按下 → 自動建立一個 dashed 圓角矩形包覆所有物件，含 24 px 邊距 + 28 px 標題區
- 外框是獨立可編輯物件：可移動、縮放、改變顏色、編輯標題
- 圖層順序自動插入到所選物件之前（位於下方，不遮蓋）

### 新功能：格式刷（Ctrl + Shift + C / V）
- 物件樣式分頁的「複製樣式 / 貼上樣式」兩個按鈕並排顯示
- **Ctrl + Shift + C**：複製選取物件的填滿 / 邊線 / 字型 / 文字色等 14 項樣式
- **Ctrl + Shift + V**：套用至所有目前選取的物件（可一次套多個）
- 連接線與鎖定物件會被略過

### 改進：熱鍵清單重新分組
說明 Modal 內熱鍵改為 6 大分群顯示：
- 工具切換、節點操作（含新增的外框 / 格式刷）、編輯、群組、移動與變形、視窗

## v0.5.0
### 修正
- **暗色系下範本標題不可見**：原本標題硬編 `#1F2937`（深灰），在暗色背景下幾乎不可見。改為 `currentColor` + `#stage { color: var(--text-main); }`，讓 SVG `<text>` 自動繼承主題色（亮色 → 深字、暗色 → 亮字）。
- **心智圖範本超出畫布**：原座標 `b.x - 160` 對左側分支會出現負值（如 x=-60），子節點裁切於畫布外。重新設計：
  - 中心節點移至畫布中央 (525, 360)
  - 4 大分支收進畫布內側 (260/800, 110/640)
  - 子節點 Y 軸對齊分支中心、X 軸貼齊分支左/右側，間距固定
  - 所有元素嚴格在 1200 × 800 內

### 新功能：連線樣式切換
選取連接線時，物件樣式分頁出現「連線樣式」區塊：
- **直線**：兩端最近錨點之間的直線
- **折線**：中點水平 / 垂直轉折，適合流程圖
- **曲線**：二次貝茲曲線，控制點為中點垂直方向偏移
- **箭頭** checkbox：可關閉終點箭頭
- 切換時箭頭方向自動依當前線型調整（直線 / 折線末段 / 曲線切線）

### 新功能：拖曳連線端點重接
選取連接線時，兩端顯示淡藍圓形控制點：
- 拖曳起點或終點 → 即時預覽藍色虛線跟隨游標
- 游標經過任一物件時，該物件顯示綠色虛線高亮（=「即將連到這裡」）
- 放開游標後，端點重新指向被高亮的物件（`fromId` / `toId` 自動更新）
- 若放開在空白處則取消重接（保持原狀）

### 互動細節
- hitTest 優先順序：endpoint > handle > 一般物件
- 連線端點 `cursor: crosshair` 提示可拖
- 重接動作寫入歷史，可 Ctrl + Z 還原

## v0.4.0
### 新功能：節點自動連接（核心架構升級）
參考使用者提供的「功能」資料夾截圖，實作心智圖類工具的核心需求 —— **物件間自動關聯，省去線條拖拉對齊**。

#### 連接線（Connector）資料模型
- 新增 `connector` 物件類型，含 `fromId` / `toId` 屬性指向兩端物件
- 渲染時動態計算錨點：取兩個物件邊界上「最接近對方」的點
- **物件移動 / 縮放時，連接線自動更新兩端位置**（無需手動調整）
- 終點自動繪製箭頭，可配置直線 / 折線樣式

#### 工具列新節點操作按鈕
畫布上方工具列右側新增四個按鈕：

| 按鈕 | 快捷鍵 | 行為 |
|---|---|---|
| 下級節點 | `Tab` | 在選取節點右側建立子節點 + 自動連線；新節點自動進入文字編輯 |
| 同級節點 | `Enter` | 在選取節點下方建立兄弟節點 + 連到同一父節點 |
| 上級節點 | `Shift + Tab` | 在選取節點左側建立父節點 + 反向連線 |
| 關係線 | `F4` | 兩個選取物件之間建立虛線連接 |

#### 關聯邏輯
- 反查父節點：透過 `toId` 找到指向當前節點的 connector，其 `fromId` 即父節點
- 反查子節點：篩選 `fromId === 當前節點 id` 的 connector
- 兄弟錯位：新增子節點時，依現有子節點數量自動垂直錯開避免重疊
- 防重複：建立關係線時若兩端之間已存在連接則跳過

#### 連動刪除
刪除節點時，所有 `fromId` 或 `toId` 指向該節點的 connector 自動移除，狀態列顯示「刪除 N 個物件（含相關連線）」。

#### 渲染細節
- 連接線不顯示縮放控點（尺寸由兩端決定，無意義可獨立縮放）
- 選取時顯示淡藍色虛線框（與 ghost 紫色、一般物件藍色區分）
- 線上文字標籤可設定（位於中點，含白底避免被線壓過）
- 透明 12 px 粗線作為 hit-test 區域，方便細線選取

## v0.3.1
### 改進：色卡重新設計
依使用者反饋「顏色重複或太相似」（純白 vs 奶油白、淺粉 vs 玫瑰粉、蜜桃 vs 杏橘、3 種黃色漸層等），改為 **8 色相 × 3 亮度 = 24 色** 結構，全部色彩明顯區隔：

| 欄 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 列 | 中性 | 紅 | 橘 | 黃 | 綠 | 青 | 藍 | 紫 |
| 1（最淺） | 白 | 淺紅 | 淺橘 | 淺黃 | 淺綠 | 淺青 | 淺藍 | 淺紫 |
| 2（淺） | 淺灰 | 玫瑰 | 杏橘 | 奶油黃 | 薄荷 | 蒂芬妮 | 天空藍 | 薰衣草 |
| 3（中等） | 中灰 | 珊瑚紅 | 橘 | 麥黃 | 草綠 | 青綠 | 海藍 | 紫 |

採用 Material Design 50/100/200 色階作為參考。

### 新功能：8 個新範本
| 範本 | 分類 | 內容 |
|---|---|---|
| **UML 類別圖** | UML | Animal 抽象類別 + Dog/Cat 子類別 + Trainable 介面，含繼承與實作箭頭 |
| **泳道圖** | 流程 | 4 條跨部門泳道（客戶 / 業務 / 工程 / 財務）+ 7 步驟方塊 + 流程箭頭 |
| **家族族譜** | 結構 | 3 代家族樹（祖父母 → 父母 + 伯姑 → 7 個孫輩），男女不同色 |
| **行業分類** | 結構 | 4 層階層樹（產業 → 第一/二/三級 → 子分類 → 範例） |
| **年度規劃** | 個人 | 中心年度主題 + 6 大領域（工作 / 健康 / 財務 / 學習 / 關係 / 興趣） |
| **心智圖** | 思考 | 中心節點 + 4 大分支 + 12 個二級分支（含色彩編碼） |
| **5W1H 分析** | 思考 | 中心議題 + 6 個分析角度（WHY / WHAT / WHO / WHEN / WHERE / HOW） |
| **甘特圖** | 時序 | 8 個任務 × 12 個月時間軸，含進度條 |

範本總數：6 → **14 個**

## v0.3.0
### 新功能
- **左側面板新增「範本」分頁**：與「圖形」分頁並列，點擊範本即套用至畫布
  - 載入前若畫布有內容會跳出確認對話框，**支援 Ctrl + Z 還原**
  - 6 個內建範本：
    - **組織架構圖**（結構）：5 層樹狀，CEO → VP → 成員 × 5 → 部門 × 3 → 團隊 × 9
    - **水平流程**（流程）：5 步驟方塊 + 引線，含副標
    - **判斷流程**（流程）：含菱形決策點與是/否分支
    - **時間軸**（時序）：5 個事件交錯上下排列
    - **四象限**（矩陣）：重要性 × 緊急性
    - **SWOT 分析**（矩陣）：S/W/O/T 四區塊
  - 新檔案 `templates.js` 含縮圖 SVG + 構建函式
- **build.js 同步支援 templates.js 內聯**：打包單檔時自動處理

## v0.2.7
### 改進
- **物件樣式色卡擴充 8 → 24 色**：依使用者建議改為柔和配色 8 欄 × 3 列佈局
  - 第 1 列：中性 / 米色系（純白 → 淺灰 → 奶油白 → 米色 → 杏色 → 沙色 → 淺褐）
  - 第 2 列：暖系（淺粉 / 玫瑰粉 / 蜜桃 / 淺橘 / 杏橘 / 奶油黃 / 檸檬黃 / 蜜黃）
  - 第 3 列：冷系（薄荷 / 草綠 / 青綠 / 粉藍 / 天空藍 / 薰衣草藍 / 薰衣草 / 淺紫）
- **色卡 cell 縮小**：高度 36 → 22 px、gap 6 → 3 px，整體更精緻
- **hover 1.45 倍放大 + 投影**：滑鼠停留時色塊明顯放大並有陰影浮起，方便辨識與點擊小色塊

## v0.2.6
### 修正
- **物件樣式面板 Sketch 漏中文化**：上一版漏掉這個 checkbox 標籤，補上 `Sketch` → `草圖`。

## v0.2.5
### 改進
- **說明 Modal 補上「調整面板功能」整段**：圖層次序、尺寸與位置、旋轉與翻轉、對齊與群組、匯入內容（拆解 / 對齊文字）共五個子段落，每顆按鈕都有說明。
- **文字內容 textarea 加大**：min-height 64 → 140、max-height 200 → 420、padding 8 → 10、行距 1.5 → 1.6，方便編輯長篇 Q&A 內容。
- **三大屬性面板剩餘英文中文化**：
  - 物件樣式：`Auto` → `自動`
  - 文字：`Convert labels to SVG` → `將文字轉為向量`
  - 調整：`Snap to Grid` → `對齊網格`、`Explore` → `瀏覽模式`
  - 形狀庫預覽：`Text` / `Heading` → `文字` / `標題`（字型改用 Noto Sans TC）
- **形狀庫預設只展開「一般」**：其他分類（基本圖形、流程圖、箭頭、實體關係、UML）預設收摺，畫面更乾淨；搜尋時自動展開命中分類。
- **預設改為暗色主題**：第一次載入時直接套用暗色，不再隨 OS prefers-color-scheme 偏好；使用者切換後仍透過 localStorage 持久化。

### 修正
- **「符合」按鈕文字變直書**：`.tool` 固定 32 px 寬無法容納 2 字中文，導致瀏覽器把「符」與「合」拆成兩行渲染為直書。`.zoom-controls .tool` 改為 `min-width: 32px; width: auto; padding: 0 10px; white-space: nowrap;`。

## v0.2.4
### 修正
- **拆解時字級被強制放大導致溢出**：`decomposeCompound` 兩處的 `Math.max(6, fontSize × scale)` 把 4.5 px 級的小字硬拉到 6 px（+33%）。匯入大型 SVG 時 scale 通常 < 1，原本 12 px CSS 字級在畫面上實際只有 4.5 px 左右；放大 33% 之後原本能容納的文字裝不下、bbox 被 `overflow:hidden` 裁切。**修正**：下限改為 3，精確保留原始視覺尺寸。
- **「對齊文字至圖形」改為自動測量 + 縮字級**：
  - 新增 `measureForeignTextHeight`：用隱藏 div 鏡像 `buildTextNode` 的 foreignObject CSS（line-height、padding、word-break）實際渲染後讀 offsetHeight
  - 新增 `findFittingFontSize`：先以目前字級測量；若超過 bbox 高，二分搜尋（最多 14 次迭代、精度 0.25 px）找出能完整裝進的最大字級
  - 替換 v0.2.3 的「成長 bbox」策略：現在 bbox 嚴格等於 shape 內部，字級自動縮小到適配；不放大字級（避免文字突然變大）
  - 統計欄位：狀態列顯示「對齊 N 個文字（其中 M 個自動縮小字級）」

### 行為對照
| 情境 | v0.2.3 | v0.2.4 |
|---|---|---|
| Shape 比文字大很多 | bbox = shape，字級不變 | bbox = shape，字級不變 |
| Shape 與文字尺寸相同 | bbox 收縮 12% → 文字裁切 | bbox = shape，字級不變或微調 |
| Shape 比文字小 | bbox 向下延伸超出 shape | bbox = shape，字級縮小至完整顯示 |

## v0.2.3
### 修正
- **「對齊文字至圖形」過度縮小導致文字裁切**：原本邏輯預設 shape 比 text 大很多、套用 6% padding。但 draw.io 原檔的 shape 與 foreignObject 尺寸常常幾乎相同，6% padding (寬高各減 12%) 把 bbox 縮小後文字裝不下 → 被 `overflow:hidden` 裁切。
  - **修正**：
    - padding 由 6% 降為 2%
    - bbox 高度取「容器內部高度」與「文字內容估算需求高度」的最大值
    - 估算公式：`charsPerLine = floor(width / (fontSize × 0.65))`、`lines = ceil(text.length / charsPerLine)`、`needHeight = lines × fontSize × 1.3 + 4`
  - 結果：shape 夠大 → 文字置中、含 word-wrap；shape 太小 → bbox 自動向下延伸以完整顯示文字（保留 draw.io overflow:visible 的視覺行為）

## v0.2.2
### 修正
- **拆解後某些文字消失（如「跟進解法」標題）**：root cause 是 draw.io 對於粗體 / 大字級標題會用原生 SVG `<text>` 而非 foreignObject 渲染。原本 `decomposeCompound` 只走 foreignObject，這些 `<text>` 元素就被遺漏（compound 移除後它們也跟著消失）。
  - **修正**：新增 `root.querySelectorAll('text')` 處理迴圈
  - 繼承父層 `<g>` 的 `font-family / font-size / font-weight / font-style / fill / text-anchor` 屬性
  - 累積父層所有 `translate(x,y)` transform
  - 將 SVG `<text>` 的 baseline 錨點換算為 bbox 左上座標（x 依 text-anchor 取 start/middle/end 偏移、y 減去 fontSize 取得頂端）
  - 寬高以「字數 × fontSize × 0.7」估算，配合 useForeignObject 啟用 word-wrap
  - 跳過 foreignObject 內部的 text 避免重複抽取

### 改進
- **選 ghost 也能直接拆解**：原本只接受選取 compound shape，選到 ghost 文字會跳「未選取」對話框。改進為：選 ghost → 從 `ghostFor.compoundId` 找到其所屬 compound 直接拆解，省去多餘步驟。

## v0.2.1
### 改進
- **拆解匯入後文字溢出修正**：拆解時建立的 text 物件加上 `useForeignObject: true`，HTML word-wrap 自動換行，不會單行延伸出 bbox。
- **拆解後狀態列加上 Ctrl+Z 提示**：明確告知使用者「不滿意可一鍵還原」。

### 新功能
- **「對齊文字至圖形」按鈕**（調整面板）：自動分析每個 text 物件，找出包含它中心的最緊密形狀（最小面積），把 text bbox 對齊到該形狀內部範圍（含 6% padding）並啟用 word-wrap。適用於：拆解後文字位置 / 大小不理想時一鍵修復。
  - 操作彈性：若有選取則只處理選取的 text；否則處理畫布上所有 text
  - 範圍判斷：以幾何 bbox 為準（不考慮旋轉）；若 text 不在任何形狀內則跳過

## v0.2.0
### 新功能
- **拆解匯入（Decompose Import）**：調整面板新增「拆解匯入（個別編輯）」按鈕。將選取的 compound shape 拆解為 N 個獨立物件（rect / ellipse / circle / line / path / polygon / text），失去原 foreignObject HTML 排版細節但取得完全個別編輯能力。每個形狀都可獨立選取、縮放、改色。

### 修正
- **Ghost 選取顯示縮放控點易誤導**：選到文字 ghost 時改為顯示「紫色細虛線框」、不顯示 8 個縮放控點與旋轉控點。明確傳達「此為文字標籤，請於右側文字分頁編輯內容；要縮放整張匯入請點圖形區（非文字區）」。
- **文字內容換行不顯示**：`updateCompoundForeignText` 用 `textContent = newText` 寫入時，HTML 規則把 `\n` 摺疊為空白。改為以 `\n` 切分後注入「textNode + `<br>` + textNode」混合結構，瀏覽器正確渲染為新行。

### 圖層列表設計確認
匯入 draw.io 後圖層列表只顯示 `svg-XX`（compound）+ N 個 `text-XX`（ghost），個別形狀並未獨立列出。這是 Ghost 架構的預期行為：
- compound 保留完整原始 SVG（含 foreignObject）→ 視覺由瀏覽器原生渲染
- ghost 提供文字編輯介面
- 若需個別操作形狀，請使用本版新增的「拆解匯入」按鈕

## v0.1.3
### 修正
- **畫布放大後左側內容被吃掉、拖曳也看不到**：root cause 是 `.stage-wrap` 使用 `justify-content: center` + `align-items: center`，當子元素（stage）尺寸超過父容器時，flex 置中對齊會使 **start 端不可達**（捲動條卡在 0 但內容已被往右推出可視範圍）。改用 `safe center` 關鍵字：放得下時置中，放不下時自動降級為 start 對齊，確保左 / 上邊始終可捲動到達。
- **匯入 SVG 後縮放，文字標籤不跟隨變形**：compound shape 縮放時，其關聯的 ghost 文字物件位置與尺寸停留在原座標 → 視覺上與 compound 內部 foreignObject 錯位。新增 `applyGhostTranslate` 與 `applyGhostScale` 兩個輔助函式：
  - 拖曳開始時 `captureGhostsForCompounds` 記錄所有 ghost 的原始 x/y/w/h/fontSize
  - move 時對 ghost 同步套用相同 dx, dy
  - resize 時計算 compound 的縮放比 sx, sy，對每個 ghost 的相對位置 × sx、相對寬高 × sy、字級 × min(sx, sy)
  - 字級下限 4 px，避免縮太小變空白

## v0.1.2
### 修正（打包工具）
- **單檔版本所有按鈕無反應**：root cause 是 `build.js` 用 `String.prototype.replace(regex, str)` 內聯 app.js，replace 的第二參數為字串時，會把 `$$` 解讀為「字面 `$`」、把 `$&` 解讀為「整段匹配」。app.js 內有 14 處 `$$`（querySelectorAll 短記法），全被破壞為 `$`，導致：
  - `const $$ = ...` 變成 `const $ = ...`（覆寫了原本的 `$`）
  - `$$('.tool').forEach(...)` 變成 `$('.tool').forEach(...)`（querySelector 不回傳陣列）
  - `.forEach is not a function` 例外中斷整個 IIFE，所有後續事件綁定都未執行
- **修正**：build.js 改用 replace 的「函式回呼」形式（`(match) => replacement`），回呼回傳的字串不會被解讀特殊字元。
- **加固**：build 時新增 `$$ 個數一致` 驗證（app.js 原本 14 個 → bundle 內也必須 14 個），避免未來再次踩到相同陷阱。

## v0.1.1
### 修正（嚴重）
- **編輯文字後整個 compound 視覺消失**：root cause 是 `updateCompoundForeignText` 用 `document.createElement('div')`（HTML namespace）解析 SVG 字串。HTML parser 不區分大小寫，把 `<linearGradient>` 小寫化成 `<lineargradient>`、`<clipPath>` → `<clippath>`；序列化回 compound.shapeSvg 後，所有 `url(#mx-gradient-xxx)` 填色找不到對應定義 → 整個 compound 變透明、看起來像不見了。
- **修正**：改用 `DOMParser({ "image/svg+xml" })` 在 SVG 命名空間下解析，配合 `XMLSerializer` 序列化，保留所有 SVG 元素的原始大小寫與命名空間。
- **附加優化**：textarea 輸入加上 80ms debounce，避免 80KB+ 大型 SVG 在每次按鍵都全量重解析造成卡頓（即時 UI 更新仍每鍵觸發，僅 compound 重序列化延後）。

## v0.1.0
### 架構變更（新功能級別）
- **Ghost 文字物件架構**：回到 v0.0.5 的視覺策略並強化編輯能力
  - **compound shape 保留完整 foreignObject** → 視覺由瀏覽器原生渲染，無條件還原 draw.io 排版（不再嘗試自行重繪文字）
  - **Ghost 文字物件**（`obj.ghostFor = { compoundId, foreignIndex }`）只負責：
    - 提供 hit-test 區域（可在畫布或圖層面板點選）
    - 在右側「文字」分頁的 textarea 接收編輯
  - **雙向綁定**：當 ghost.text 變更時，自動定位 compound.shapeSvg 內第 N 個 foreignObject，以 TreeWalker 保留原 HTML 結構地替換文字內容（保留 font / color / 對齊等樣式）
- **圖層列表標示**：ghost 物件以紫色「T」前綴與紫色邊框圖示區分
- **圖層點擊不擴展群組**：讓使用者能單獨選取 ghost 進行編輯

### 為何重新設計
- v0.0.6–0.0.8 嘗試將 foreignObject 拆解為自繪 SVG `<text>` 或 `<foreignObject>` + flex div：永遠無法 100% 還原 draw.io 的 HTML 排版細節（white-space、inline-block、混合 span 樣式等）
- 唯一可靠方案：將原始 foreignObject 完整交給瀏覽器渲染，自己只負責「定位編輯介面」

## v0.0.8
### 修正
- **v0.0.7 仍然溢出的真正 root cause**：上一版的 `widthBoost` 邏輯把每個 bbox 等比放大 1.67×，因 draw.io 原始排版極度緊湊，放大後相鄰文字標籤的 bbox 互相重疊 → 視覺上像文字跨越進隔壁框內。
- **修正策略**：
  1. 移除 widthBoost，bbox 嚴格按 `wf * scale` 比例縮放
  2. 字級下限由 8px 降為 6px（小於 8px 時保留小字體，依賴使用者放大畫布閱讀）
  3. foreignObject 與內層 div 雙層 `overflow:hidden` clip
  4. CSS 改用 `word-break:break-all` + `overflow-wrap:anywhere`，連續中文字串也強制斷字
  5. 高度自動估算：以「字數 / 每行可容字數 × 字級高度」估算實際所需高度，最多展開 4 倍原高度；避免 draw.io 寫了 `height=28` 但實際內容需要 60px 時被截斷

## v0.0.7
### 修正
- **draw.io 匯入文字溢出 bbox**：原本將 foreignObject 內含 HTML auto-wrap 的多行文字硬轉為單行 SVG `<text>` + `text-anchor='middle'`，導致長文字左右兩端遠超過原始 72px 的 bbox、視覺上散布畫面各處。改以 `<foreignObject>` + HTML `<div>`（`white-space: pre-wrap`、`word-break: break-word`、`overflow: hidden`）渲染，文字嚴格收束在 bbox 內，與 draw.io 原視覺一致。
- 文字物件新增 `useForeignObject` 旗標：draw.io 匯入時自動啟用；T 工具建立的短文字仍使用標準 SVG `<text>` 渲染以維持向量輸出純淨度。

## v0.0.6
### 修正
- **draw.io 匯入後文字重複顯示**：匯入時將 compound shape 內的 `<foreignObject>` 剝除，讓抽取出的可編輯文字標籤成為唯一文字來源，避免兩層相同文字疊加。
- **圖層點擊不會自動切到對應屬性分頁**：選取文字物件時，右側面板自動切換至「文字」分頁。
- **形狀庫存在跨類別視覺重複**：移除「基本圖形.square」、流程圖中與一般類重複的 7 個項目、ER 中與一般類重複的 3 個項目、UML 中與一般類重複的 3 個項目；總形狀數由 65 降為 51，視覺更聚焦。
- **「鋼筆 / 路徑」工具與直線重複**：移除該工具及 P 快捷鍵；未來補完整路徑編輯時再重新加入。

## v0.0.4 → v0.0.5
- 文字頁籤新增「文字內容」即時編輯區（textarea）
- 圖層 / 歷史紀錄合併至右側面板底部，移除浮動 float-panel
- 點圖層自動平滑捲動置中，並以光暈閃爍提示
- 移除「內容　數值」鍵值預覽區

## v0.0.4
- 修正 text-only 物件無法被點選與雙擊編輯
- 修正 opacity=0 物件遮蔽底層點擊
- 內嵌文字編輯器字級隨畫布縮放
- 移除「佈景主題」分頁、「匯入 PNG」按鈕、「霍家私塾 v0.x」副標題、預設色卡下方的小點

## v0.0.3（功能合併）
- 一鍵清除按鈕（含確認、可 Undo）
- 移除啟動時的預設範例
- 手型工具（H 快捷鍵 + 工具列圖示）
- 智慧對齊輔助線（Smart Guides，Alt 暫停）
- Marquee 框選（Shift 加入既有選取）
- 真正的群組功能（Ctrl+G / Ctrl+Shift+G）

## v0.0.2
- draw.io / mxGraph 格式 SVG 匯入支援
- 大尺寸檔案自動縮放至畫布
- 內嵌文字編輯（取代 prompt）
- Space + 拖曳平移、方向鍵微調、長寬比鎖定
- 主題持久化 + 系統偏好偵測

## v0.0.1（首版）
- HTML / CSS / JS 骨架
- 三大屬性面板（物件樣式 / 文字 / 調整）
- 形狀庫 6 大分類
- 選取、變形、旋轉、翻轉
- 歷史紀錄（Undo / Redo，上限 50 筆）
- SVG / PNG 匯出
