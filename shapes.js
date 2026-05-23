/* =============================================================
   形狀庫資料（v0.0.6 去重版）
   原則：
   - 一般：基礎容器與文字
   - 基本圖形：純幾何形狀
   - 流程圖：只保留流程圖語義獨特的形狀（一般已涵蓋的 rect / diamond /
     pill / parallelogram / hexagon / circle 不重複收錄）
   - 箭頭：方向標記
   - 實體關係：僅保留 ER 語義獨特的標記
   - UML：僅保留 UML 語義獨特的標記
   stroke 統一為 currentColor，可適應亮 / 暗主題
   ============================================================= */

const SHAPE_STROKE = 'currentColor';
const SHAPE_FILL = 'transparent';

const SHAPES = [
  /* ============ 一般 ============ */
  { cat: '一般', items: [
    { id: 'rect', name: '矩形', svg: `<rect x="6" y="14" width="88" height="32" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'rect-round', name: '圓角矩形', svg: `<rect x="6" y="14" width="88" height="32" rx="6" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'rect-pill', name: '膠囊', svg: `<rect x="6" y="14" width="88" height="32" rx="16" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'rect-double', name: '雙線矩形', svg: `<rect x="6" y="14" width="88" height="32" fill="transparent" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="17" width="82" height="26" fill="none" stroke="currentColor" stroke-width="0.8"/>` },
    { id: 'ellipse', name: '橢圓', svg: `<ellipse cx="50" cy="30" rx="44" ry="18" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'circle', name: '圓形', svg: `<circle cx="50" cy="30" r="22" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'diamond', name: '菱形', svg: `<polygon points="50,8 92,30 50,52 8,30" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'parallelogram', name: '平行四邊形', svg: `<polygon points="20,14 96,14 80,46 4,46" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'trapezoid', name: '梯形', svg: `<polygon points="20,14 80,14 96,46 4,46" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'hexagon', name: '六邊形', svg: `<polygon points="20,14 80,14 96,30 80,46 20,46 4,30" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'note', name: '註記', svg: `<path d="M6 14 H82 L94 26 V46 H6 Z M82 14 V26 H94" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'cloud', name: '雲朵', svg: `<path d="M22 38 Q12 38 14 28 Q14 20 24 20 Q26 12 36 14 Q44 8 54 14 Q66 12 70 22 Q80 22 80 30 Q86 32 84 40 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'document', name: '文件', svg: `<path d="M6 14 H94 V42 Q72 50 50 42 Q28 34 6 42 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'callout', name: '對話框', svg: `<path d="M6 14 H94 V40 H58 L50 50 L46 40 H6 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'text-only', name: '文字', svg: `<text x="50" y="38" text-anchor="middle" font-size="20" fill="currentColor" font-family="Inter">Text</text>` },
    { id: 'heading', name: '標題', svg: `<text x="50" y="36" text-anchor="middle" font-size="18" fill="currentColor" font-weight="700" font-family="Inter">Heading</text>` },
  ]},

  /* ============ 基本圖形（純幾何） ============ */
  { cat: '基本圖形', items: [
    { id: 'triangle', name: '三角形', svg: `<polygon points="50,10 90,50 10,50" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'pentagon', name: '五邊形', svg: `<polygon points="50,8 92,30 78,52 22,52 8,30" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'octagon', name: '八邊形', svg: `<polygon points="30,8 70,8 92,22 92,38 70,52 30,52 8,38 8,22" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'star', name: '星形', svg: `<polygon points="50,6 60,24 80,26 65,40 70,58 50,48 30,58 35,40 20,26 40,24" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'heart', name: '心形', svg: `<path d="M50 50 C20 32 20 14 36 14 C44 14 50 22 50 22 C50 22 56 14 64 14 C80 14 80 32 50 50 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'lightning', name: '閃電', svg: `<polygon points="48,6 28,32 44,32 36,54 64,28 48,28 56,6" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'moon', name: '月亮', svg: `<path d="M62 30 A24 24 0 1 1 38 6 A18 18 0 0 0 62 30 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'drop', name: '水滴', svg: `<path d="M50 8 C32 30 30 50 50 52 C70 50 68 30 50 8 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'cross', name: '十字', svg: `<polygon points="40,8 60,8 60,22 76,22 76,38 60,38 60,52 40,52 40,38 24,38 24,22 40,22" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
  ]},

  /* ============ 流程圖（語義獨特，與一般類不重複） ============ */
  { cat: '流程圖', items: [
    { id: 'flow-manual', name: '人工輸入', svg: `<polygon points="6,22 94,14 94,46 6,46" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-database', name: '資料庫', svg: `<path d="M6 16 Q6 8 50 8 Q94 8 94 16 V44 Q94 52 50 52 Q6 52 6 44 Z M6 16 Q6 24 50 24 Q94 24 94 16" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-subroutine', name: '子流程', svg: `<rect x="6" y="14" width="88" height="32" fill="transparent" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="14" x2="14" y2="46" stroke="currentColor" stroke-width="1.5"/><line x1="86" y1="14" x2="86" y2="46" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-display', name: '顯示', svg: `<path d="M14 14 H88 L94 30 L88 46 H14 L4 30 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-merge', name: '合併', svg: `<polygon points="50,52 14,14 86,14" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-storage', name: '儲存', svg: `<path d="M14 14 H94 V46 H14 Q4 30 14 14 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'flow-delay', name: '延遲', svg: `<path d="M6 14 H78 Q94 14 94 30 Q94 46 78 46 H6 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
  ]},

  /* ============ 箭頭 ============ */
  { cat: '箭頭', items: [
    { id: 'arrow-right', name: '右箭頭', svg: `<polygon points="6,22 64,22 64,12 94,30 64,48 64,38 6,38" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-left', name: '左箭頭', svg: `<polygon points="94,22 36,22 36,12 6,30 36,48 36,38 94,38" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-up', name: '上箭頭', svg: `<polygon points="38,52 38,18 26,18 50,4 74,18 62,18 62,52" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-down', name: '下箭頭', svg: `<polygon points="38,4 38,38 26,38 50,52 74,38 62,38 62,4" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-double-h', name: '雙向（水平）', svg: `<polygon points="6,30 22,12 22,22 78,22 78,12 94,30 78,48 78,38 22,38 22,48" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-double-v', name: '雙向（垂直）', svg: `<polygon points="50,4 68,18 60,18 60,42 68,42 50,56 32,42 40,42 40,18 32,18" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-bent', name: '彎折', svg: `<polygon points="10,18 50,18 50,8 78,28 50,48 50,38 10,38" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'arrow-curved', name: '曲線箭頭', svg: `<path d="M6 46 Q40 6 86 26 L78 16 M86 26 L74 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>` },
    { id: 'arrow-simple-r', name: '線段右', svg: `<line x1="6" y1="30" x2="86" y2="30" stroke="currentColor" stroke-width="1.8"/><polyline points="80,22 92,30 80,38" fill="none" stroke="currentColor" stroke-width="1.8"/>` },
    { id: 'arrow-dashed', name: '虛線右', svg: `<line x1="6" y1="30" x2="86" y2="30" stroke="currentColor" stroke-width="1.8" stroke-dasharray="4 3"/><polyline points="80,22 92,30 80,38" fill="none" stroke="currentColor" stroke-width="1.8"/>` },
  ]},

  /* ============ 實體關係（僅保留 ER 獨有標記） ============ */
  { cat: '實體關係', items: [
    { id: 'er-weak', name: '弱實體', svg: `<rect x="6" y="14" width="88" height="32" fill="transparent" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="18" width="80" height="24" fill="none" stroke="currentColor" stroke-width="1"/>` },
    { id: 'er-multi', name: '多值屬性', svg: `<ellipse cx="50" cy="30" rx="40" ry="18" fill="transparent" stroke="currentColor" stroke-width="1.5"/><ellipse cx="50" cy="30" rx="36" ry="14" fill="none" stroke="currentColor" stroke-width="1"/>` },
    { id: 'er-key', name: '鍵屬性', svg: `<ellipse cx="50" cy="30" rx="40" ry="18" fill="transparent" stroke="currentColor" stroke-width="1.5"/><line x1="22" y1="40" x2="78" y2="40" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'er-derived', name: '衍生屬性', svg: `<ellipse cx="50" cy="30" rx="40" ry="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>` },
  ]},

  /* ============ UML（僅保留 UML 獨有標記） ============ */
  { cat: 'UML', items: [
    { id: 'uml-class', name: '類別', svg: `<rect x="6" y="6" width="88" height="48" fill="transparent" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="22" x2="94" y2="22" stroke="currentColor" stroke-width="1"/><line x1="6" y1="38" x2="94" y2="38" stroke="currentColor" stroke-width="1"/>` },
    { id: 'uml-actor', name: '行動者', svg: `<circle cx="50" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="50" y1="20" x2="50" y2="40" stroke="currentColor" stroke-width="1.5"/><line x1="36" y1="28" x2="64" y2="28" stroke="currentColor" stroke-width="1.5"/><line x1="50" y1="40" x2="38" y2="54" stroke="currentColor" stroke-width="1.5"/><line x1="50" y1="40" x2="62" y2="54" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'uml-package', name: '套件', svg: `<path d="M6 16 H40 V22 H94 V52 H6 Z" fill="transparent" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'uml-interface', name: '介面', svg: `<circle cx="50" cy="30" r="18" fill="transparent" stroke="currentColor" stroke-width="1.5"/><text x="50" y="35" text-anchor="middle" font-size="10" fill="currentColor" font-family="Inter">I</text>` },
    { id: 'uml-component', name: '元件', svg: `<rect x="14" y="14" width="80" height="32" fill="transparent" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="20" width="14" height="8" fill="transparent" stroke="currentColor" stroke-width="1"/><rect x="6" y="34" width="14" height="8" fill="transparent" stroke="currentColor" stroke-width="1"/>` },
  ]},
];

/* 樣式預設色卡（呼應 image.png 中的色塊） */
const PRESET_STYLES = [
  { fill: '#FFFFFF', stroke: '#222831' },
  { fill: '#ECEEF1', stroke: '#333333' },
  { fill: '#D6E4F5', stroke: '#4A90E2' },
  { fill: '#D9EFE0', stroke: '#5AC8A5' },
  { fill: '#FFE5D0', stroke: '#FFB74D' },
  { fill: '#FFF4C9', stroke: '#E0A700' },
  { fill: '#FFD7E0', stroke: '#F06292' },
  { fill: '#E6D9FA', stroke: '#9B6EF3' },
];

if (typeof window !== 'undefined') {
  window.__SHAPES__ = SHAPES;
  window.__PRESETS__ = PRESET_STYLES;
}
