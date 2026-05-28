/* =============================================================
   範本資料庫（v0.3.0）
   每個範本含：
   - id / name / category / thumb（SVG 字串）
   - build()：回傳物件陣列，套用至 state.objects
   ============================================================= */

// === 共用 helper 函式 ===
function _txtFontDefault() {
  return {
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    textAlign: 'center',
    textVAlign: 'middle',
  };
}

function _rect(x, y, w, h, text, fill, stroke, fontSize) {
  return {
    type: 'rect',
    x, y, w, h,
    fill: fill || '#FFFFFF',
    fillEnabled: true,
    stroke: stroke || '#333333',
    strokeEnabled: true,
    strokeWidth: 1.5,
    text: text || '',
    fontSize: fontSize || 16,
    textColor: '#1F2937',
    ..._txtFontDefault(),
  };
}

function _roundRect(x, y, w, h, text, fill, stroke, fontSize) {
  return Object.assign(_rect(x, y, w, h, text, fill, stroke, fontSize), { rx: 8 });
}

function _ellipse(x, y, w, h, text, fill, stroke, fontSize) {
  return {
    type: 'ellipse',
    x, y, w, h,
    fill: fill || '#FFFFFF',
    fillEnabled: true,
    stroke: stroke || '#333333',
    strokeEnabled: true,
    strokeWidth: 1.5,
    text: text || '',
    fontSize: fontSize || 16,
    textColor: '#1F2937',
    ..._txtFontDefault(),
  };
}

function _line(x1, y1, x2, y2, color) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.max(2, Math.abs(x2 - x1));
  const h = Math.max(2, Math.abs(y2 - y1));
  return {
    type: 'line',
    x, y, w, h,
    fill: 'transparent',
    fillEnabled: false,
    stroke: color || '#4B5563',
    strokeEnabled: true,
    strokeWidth: 1.5,
  };
}

function _arrow(x1, y1, x2, y2, color, label) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  return {
    type: 'shape',
    x: cx - len / 2,
    y: cy - 12,
    w: len,
    h: 24,
    rotation: Math.round(angle),
    shapeId: 'tpl-arrow',
    shapeSvg: `<line x1="0" y1="30" x2="${92}" y2="30" stroke="${color || '#4B5563'}" stroke-width="2"/><polyline points="84,22 96,30 84,38" fill="none" stroke="${color || '#4B5563'}" stroke-width="2"/>`,
    shapeViewBox: { x: 0, y: 0, w: 100, h: 60 },
    preserveStyle: true,
    fill: 'transparent',
    fillEnabled: false,
    stroke: color || '#4B5563',
    strokeEnabled: true,
    text: label || '',
    fontSize: 12,
    textColor: color || '#4B5563',
    ..._txtFontDefault(),
  };
}

function _diamond(x, y, w, h, text, fill, stroke, fontSize) {
  return {
    type: 'shape',
    x, y, w, h,
    shapeId: 'tpl-diamond',
    shapeSvg: `<polygon points="50,8 92,30 50,52 8,30" fill="${fill || '#FFF4C9'}" stroke="${stroke || '#E0A700'}" stroke-width="1.5"/>`,
    shapeViewBox: { x: 0, y: 0, w: 100, h: 60 },
    preserveStyle: true,
    fill: fill || '#FFF4C9',
    fillEnabled: true,
    stroke: stroke || '#E0A700',
    strokeEnabled: true,
    text: text || '',
    fontSize: fontSize || 16,
    textColor: '#1F2937',
    ..._txtFontDefault(),
  };
}

// ========================================
// 範本 1：組織架構圖
// ========================================
function buildOrgChart() {
  const blue = '#D6E4F5', blueB = '#4A90E2';
  const green = '#D9EFE0', greenB = '#5AC8A5';
  const peach = '#FFE5D0', peachB = '#FFB74D';
  const lineColor = '#9CA3AF';
  const objs = [];
  // CEO
  objs.push(_roundRect(500, 80, 200, 60, '專案經理', blue, blueB, 18));
  // 中層
  objs.push(_roundRect(500, 200, 200, 60, '專案副經理', green, greenB, 16));
  // 第三層成員
  const memY = 320;
  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 220;
    objs.push(_roundRect(x, memY, 160, 50, `成員 ${i + 1}`, peach, peachB, 14));
  }
  // 第四層部門
  const yellow = '#FFF4C9', yellowB = '#E0A700';
  const deptY = 460;
  ['部門 A', '部門 B', '部門 C'].forEach((name, i) => {
    objs.push(_roundRect(150 + i * 360, deptY, 240, 50, name, yellow, yellowB, 14));
  });
  // 第五層團隊
  const lightBlue = '#C5D9F1', lightBlueB = '#3A7BC8';
  const teamY = 590;
  for (let g = 0; g < 3; g++) {
    for (let i = 0; i < 3; i++) {
      const x = 90 + g * 360 + i * 80;
      objs.push(_roundRect(x, teamY, 70, 40, `團隊 ${i + 1}`, lightBlue, lightBlueB, 11));
    }
  }
  // 連接線
  objs.push(_line(600, 140, 600, 200, lineColor));
  objs.push(_line(600, 260, 600, 320, lineColor));
  objs.push(_line(160, 320, 1040, 320, lineColor));
  for (let i = 0; i < 5; i++) {
    objs.push(_line(160 + i * 220, 290, 160 + i * 220, 320, lineColor));
  }
  for (let i = 0; i < 3; i++) {
    objs.push(_line(270 + i * 360, 510, 270 + i * 360, 590, lineColor));
  }
  return objs;
}

// ========================================
// 範本 2：水平流程圖（5 步驟）
// ========================================
function buildHorizontalFlow() {
  const colors = [
    ['#D6E4F5', '#4A90E2'],
    ['#D9EFE0', '#5AC8A5'],
    ['#FFF4C9', '#E0A700'],
    ['#FFE5D0', '#FFB74D'],
    ['#FFD7E0', '#F06292'],
  ];
  const labels = ['步驟一', '步驟二', '步驟三', '步驟四', '步驟五'];
  const subs = ['啟動準備', '資料蒐集', '分析評估', '執行落實', '結果驗收'];
  const objs = [];
  const stepW = 180;
  const gap = 36;
  const totalW = 5 * stepW + 4 * gap;
  const startX = (1200 - totalW) / 2;
  const y = 320;
  for (let i = 0; i < 5; i++) {
    const x = startX + i * (stepW + gap);
    const [fill, stroke] = colors[i];
    objs.push(_roundRect(x, y, stepW, 100, labels[i], fill, stroke, 18));
    objs.push(_rect(x + 20, y + 110, stepW - 40, 40, subs[i], 'transparent', 'transparent', 13));
    objs[objs.length - 1].strokeEnabled = false;
    objs[objs.length - 1].fillEnabled = false;
    objs[objs.length - 1].textColor = '#4B5563';
    if (i < 4) {
      objs.push(_arrow(x + stepW, y + 50, x + stepW + gap, y + 50, '#6B7280'));
    }
  }
  // 標題
  const title = _rect(400, 180, 400, 60, '流程圖標題', 'transparent', 'transparent', 28);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = '#1F2937'; title.fontWeight = 'bold';
  objs.push(title);
  return objs;
}

// ========================================
// 範本 3：判斷流程（含菱形）
// ========================================
function buildDecisionFlow() {
  const objs = [];
  const cx = 600;
  // 開始
  objs.push(_roundRect(cx - 120, 80, 240, 60, '開始', '#D9EFE0', '#5AC8A5', 18));
  // 處理 1
  objs.push(_rect(cx - 120, 200, 240, 60, '輸入資料', '#FFFFFF', '#333333', 16));
  // 判斷
  objs.push(_diamond(cx - 140, 320, 280, 140, '資料正確？', '#FFF4C9', '#E0A700', 16));
  // 處理 2（是）
  objs.push(_rect(180, 360, 200, 60, '進行下一步', '#D6E4F5', '#4A90E2', 14));
  // 處理 3（否）
  objs.push(_rect(820, 360, 200, 60, '回到上一步', '#FFD7E0', '#F06292', 14));
  // 結束
  objs.push(_roundRect(cx - 120, 540, 240, 60, '結束', '#E6D9FA', '#9B6EF3', 18));
  // 連接線
  const line = '#6B7280';
  objs.push(_arrow(cx, 140, cx, 200, line));
  objs.push(_arrow(cx, 260, cx, 320, line));
  objs.push(_arrow(cx - 140, 390, 380, 390, line, '是'));
  objs.push(_arrow(cx + 140, 390, 820, 390, line, '否'));
  objs.push(_arrow(280, 420, 280, 540, line));
  objs.push(_arrow(280, 540, cx - 120, 570, line));
  objs.push(_arrow(920, 420, 920, 540, line));
  objs.push(_arrow(920, 540, cx + 120, 570, line));
  return objs;
}

// ========================================
// 範本 4：時間軸（5 個事件）
// ========================================
function buildTimeline() {
  const objs = [];
  // 標題
  const title = _rect(400, 60, 400, 50, '時間軸標題', 'transparent', 'transparent', 24);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = '#1F2937'; title.fontWeight = 'bold';
  objs.push(title);
  // 主軸線
  objs.push(_line(80, 400, 1120, 400, '#9CA3AF'));
  // 5 個節點
  const events = [
    ['2021', '專案啟動', '初步規劃完成'],
    ['2022', '原型開發', '完成初版'],
    ['2023', '正式上線', '使用者突破 1 萬'],
    ['2024', '擴張階段', '進入新市場'],
    ['2025', '里程碑', '達成預設目標'],
  ];
  const colors = [
    ['#D6E4F5', '#4A90E2'],
    ['#D9EFE0', '#5AC8A5'],
    ['#FFF4C9', '#E0A700'],
    ['#FFE5D0', '#FFB74D'],
    ['#E6D9FA', '#9B6EF3'],
  ];
  events.forEach((ev, i) => {
    const x = 130 + i * 220;
    const [fill, stroke] = colors[i];
    // 節點圓
    objs.push(_ellipse(x - 18, 382, 36, 36, '', fill, stroke, 14));
    // 年份（上方）
    const yearY = i % 2 === 0 ? 220 : 460;
    const yearLabel = _rect(x - 60, yearY, 120, 40, ev[0], fill, stroke, 18);
    yearLabel.rx = 6; yearLabel.fontWeight = 'bold';
    objs.push(yearLabel);
    // 事件卡片
    const cardY = i % 2 === 0 ? 270 : 510;
    objs.push(_roundRect(x - 110, cardY, 220, 80, ev[1] + '\n' + ev[2], '#FFFFFF', stroke, 14));
    // 引線
    objs.push(_line(x, 400, x, i % 2 === 0 ? 260 : 460, stroke));
  });
  return objs;
}

// ========================================
// 範本 5：四象限分析
// ========================================
function buildQuadrant() {
  const objs = [];
  const cx = 600, cy = 420;
  const halfW = 440, halfH = 280;
  // 標題
  const title = _rect(400, 50, 400, 50, '四象限分析', 'transparent', 'transparent', 26);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = '#1F2937'; title.fontWeight = 'bold';
  objs.push(title);
  // 四個區塊
  objs.push(_rect(cx - halfW, cy - halfH, halfW, halfH, '', '#D6E4F5', '#4A90E2', 14));
  objs.push(_rect(cx, cy - halfH, halfW, halfH, '', '#D9EFE0', '#5AC8A5', 14));
  objs.push(_rect(cx - halfW, cy, halfW, halfH, '', '#FFE5D0', '#FFB74D', 14));
  objs.push(_rect(cx, cy, halfW, halfH, '', '#FFD7E0', '#F06292', 14));
  // 區塊標題
  const labels = [
    { x: cx - halfW + 16, y: cy - halfH + 16, txt: '第一象限\n（重要 + 緊急）' },
    { x: cx + 16, y: cy - halfH + 16, txt: '第二象限\n（重要 + 不緊急）' },
    { x: cx - halfW + 16, y: cy + 16, txt: '第三象限\n（不重要 + 緊急）' },
    { x: cx + 16, y: cy + 16, txt: '第四象限\n（不重要 + 不緊急）' },
  ];
  labels.forEach((l) => {
    const t = _rect(l.x, l.y, 180, 50, l.txt, 'transparent', 'transparent', 14);
    t.strokeEnabled = false; t.fillEnabled = false;
    t.fontWeight = 'bold'; t.textAlign = 'left'; t.textVAlign = 'top';
    objs.push(t);
  });
  // 軸標示
  const xAxis = _rect(cx + halfW + 8, cy - 20, 60, 40, '緊急 →', 'transparent', 'transparent', 13);
  xAxis.strokeEnabled = false; xAxis.fillEnabled = false; xAxis.textColor = '#6B7280';
  objs.push(xAxis);
  const yAxis = _rect(cx - halfW - 80, cy - halfH - 30, 70, 30, '↑ 重要', 'transparent', 'transparent', 13);
  yAxis.strokeEnabled = false; yAxis.fillEnabled = false; yAxis.textColor = '#6B7280';
  objs.push(yAxis);
  return objs;
}

// ========================================
// 範本 6：SWOT 分析
// ========================================
function buildSWOT() {
  const objs = [];
  // 標題
  const title = _rect(400, 50, 400, 50, 'SWOT 分析', 'transparent', 'transparent', 26);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = '#1F2937'; title.fontWeight = 'bold';
  objs.push(title);
  // 四象限
  const cx = 600, cy = 430;
  const halfW = 420, halfH = 270;
  // S（左上）
  objs.push(_rect(cx - halfW, cy - halfH, halfW, halfH, '', '#D9EFE0', '#5AC8A5'));
  // W（右上）
  objs.push(_rect(cx, cy - halfH, halfW, halfH, '', '#FFE5D0', '#FFB74D'));
  // O（左下）
  objs.push(_rect(cx - halfW, cy, halfW, halfH, '', '#D6E4F5', '#4A90E2'));
  // T（右下）
  objs.push(_rect(cx, cy, halfW, halfH, '', '#FFD7E0', '#F06292'));
  // 標題與內文
  const sections = [
    { x: cx - halfW, y: cy - halfH, title: 'S 優勢', sub: 'Strengths\n• 列出組織的內部優勢\n• 獨有的資源或能力' },
    { x: cx,         y: cy - halfH, title: 'W 劣勢', sub: 'Weaknesses\n• 需要改進的內部弱點\n• 缺乏的資源' },
    { x: cx - halfW, y: cy,         title: 'O 機會', sub: 'Opportunities\n• 外部環境的有利因素\n• 可把握的趨勢' },
    { x: cx,         y: cy,         title: 'T 威脅', sub: 'Threats\n• 外部環境的不利因素\n• 競爭與風險' },
  ];
  sections.forEach((s) => {
    const t = _rect(s.x + 24, s.y + 20, 200, 36, s.title, 'transparent', 'transparent', 22);
    t.strokeEnabled = false; t.fillEnabled = false; t.fontWeight = 'bold';
    t.textAlign = 'left'; t.textVAlign = 'top';
    objs.push(t);
    const sub = _rect(s.x + 24, s.y + 70, halfW - 48, halfH - 90, s.sub, 'transparent', 'transparent', 14);
    sub.strokeEnabled = false; sub.fillEnabled = false; sub.textColor = '#4B5563';
    sub.textAlign = 'left'; sub.textVAlign = 'top';
    objs.push(sub);
  });
  return objs;
}

// ========================================
// 範本縮圖（小型 SVG，於範本面板顯示）
// ========================================
const TEMPLATES = [
  {
    id: 'org-chart',
    name: '組織架構圖',
    category: '結構',
    thumb: `
      <rect x="42" y="6"  width="20" height="8" fill="#D6E4F5" stroke="currentColor" stroke-width="0.5"/>
      <rect x="42" y="22" width="20" height="8" fill="#D9EFE0" stroke="currentColor" stroke-width="0.5"/>
      <rect x="8"  y="38" width="14" height="6" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="28" y="38" width="14" height="6" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="48" y="38" width="14" height="6" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="68" y="38" width="14" height="6" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <line x1="52" y1="14" x2="52" y2="22" stroke="currentColor" stroke-width="0.5"/>
      <line x1="52" y1="30" x2="52" y2="34" stroke="currentColor" stroke-width="0.5"/>
      <line x1="15" y1="34" x2="89" y2="34" stroke="currentColor" stroke-width="0.5"/>
      <line x1="15" y1="34" x2="15" y2="38" stroke="currentColor" stroke-width="0.5"/>
      <line x1="35" y1="34" x2="35" y2="38" stroke="currentColor" stroke-width="0.5"/>
      <line x1="55" y1="34" x2="55" y2="38" stroke="currentColor" stroke-width="0.5"/>
      <line x1="75" y1="34" x2="75" y2="38" stroke="currentColor" stroke-width="0.5"/>
    `,
    build: buildOrgChart,
  },
  {
    id: 'horizontal-flow',
    name: '水平流程',
    category: '流程',
    thumb: `
      <rect x="6"  y="22" width="14" height="14" fill="#D6E4F5" stroke="currentColor" stroke-width="0.5"/>
      <rect x="26" y="22" width="14" height="14" fill="#D9EFE0" stroke="currentColor" stroke-width="0.5"/>
      <rect x="46" y="22" width="14" height="14" fill="#FFF4C9" stroke="currentColor" stroke-width="0.5"/>
      <rect x="66" y="22" width="14" height="14" fill="#FFE5D0" stroke="currentColor" stroke-width="0.5"/>
      <rect x="86" y="22" width="8"  height="14" fill="#FFD7E0" stroke="currentColor" stroke-width="0.5"/>
      <line x1="20" y1="29" x2="26" y2="29" stroke="currentColor" stroke-width="0.5"/>
      <line x1="40" y1="29" x2="46" y2="29" stroke="currentColor" stroke-width="0.5"/>
      <line x1="60" y1="29" x2="66" y2="29" stroke="currentColor" stroke-width="0.5"/>
      <line x1="80" y1="29" x2="86" y2="29" stroke="currentColor" stroke-width="0.5"/>
    `,
    build: buildHorizontalFlow,
  },
  {
    id: 'decision-flow',
    name: '判斷流程',
    category: '流程',
    thumb: `
      <rect x="36" y="4"  width="28" height="8" rx="3" fill="#D9EFE0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="36" y="16" width="28" height="8" fill="#fff" stroke="currentColor" stroke-width="0.4"/>
      <polygon points="50,28 70,38 50,48 30,38" fill="#FFF4C9" stroke="currentColor" stroke-width="0.5"/>
      <rect x="6"  y="34" width="20" height="8" fill="#D6E4F5" stroke="currentColor" stroke-width="0.4"/>
      <rect x="74" y="34" width="20" height="8" fill="#FFD7E0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="36" y="52" width="28" height="8" rx="3" fill="#E6D9FA" stroke="currentColor" stroke-width="0.4"/>
    `,
    build: buildDecisionFlow,
  },
  {
    id: 'timeline',
    name: '時間軸',
    category: '時序',
    thumb: `
      <line x1="6" y1="30" x2="94" y2="30" stroke="currentColor" stroke-width="0.6"/>
      <circle cx="16" cy="30" r="3" fill="#D6E4F5" stroke="currentColor" stroke-width="0.4"/>
      <circle cx="35" cy="30" r="3" fill="#D9EFE0" stroke="currentColor" stroke-width="0.4"/>
      <circle cx="54" cy="30" r="3" fill="#FFF4C9" stroke="currentColor" stroke-width="0.4"/>
      <circle cx="73" cy="30" r="3" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <circle cx="92" cy="30" r="3" fill="#E6D9FA" stroke="currentColor" stroke-width="0.4"/>
      <rect x="8"  y="10" width="16" height="8" fill="#FFFFFF" stroke="currentColor" stroke-width="0.3"/>
      <rect x="46" y="10" width="16" height="8" fill="#FFFFFF" stroke="currentColor" stroke-width="0.3"/>
      <rect x="84" y="10" width="12" height="8" fill="#FFFFFF" stroke="currentColor" stroke-width="0.3"/>
      <rect x="27" y="42" width="16" height="8" fill="#FFFFFF" stroke="currentColor" stroke-width="0.3"/>
      <rect x="65" y="42" width="16" height="8" fill="#FFFFFF" stroke="currentColor" stroke-width="0.3"/>
    `,
    build: buildTimeline,
  },
  {
    id: 'quadrant',
    name: '四象限',
    category: '矩陣',
    thumb: `
      <rect x="6"  y="6"  width="44" height="22" fill="#D6E4F5" stroke="currentColor" stroke-width="0.4"/>
      <rect x="50" y="6"  width="44" height="22" fill="#D9EFE0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="6"  y="28" width="44" height="22" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="50" y="28" width="44" height="22" fill="#FFD7E0" stroke="currentColor" stroke-width="0.4"/>
      <line x1="50" y1="6" x2="50" y2="50" stroke="currentColor" stroke-width="0.5"/>
      <line x1="6" y1="28" x2="94" y2="28" stroke="currentColor" stroke-width="0.5"/>
    `,
    build: buildQuadrant,
  },
  {
    id: 'swot',
    name: 'SWOT 分析',
    category: '矩陣',
    thumb: `
      <rect x="6"  y="6"  width="44" height="22" fill="#D9EFE0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="50" y="6"  width="44" height="22" fill="#FFE5D0" stroke="currentColor" stroke-width="0.4"/>
      <rect x="6"  y="28" width="44" height="22" fill="#D6E4F5" stroke="currentColor" stroke-width="0.4"/>
      <rect x="50" y="28" width="44" height="22" fill="#FFD7E0" stroke="currentColor" stroke-width="0.4"/>
      <text x="14" y="20" font-size="7" fill="currentColor" font-weight="700">S</text>
      <text x="58" y="20" font-size="7" fill="currentColor" font-weight="700">W</text>
      <text x="14" y="42" font-size="7" fill="currentColor" font-weight="700">O</text>
      <text x="58" y="42" font-size="7" fill="currentColor" font-weight="700">T</text>
    `,
    build: buildSWOT,
  },
];

if (typeof window !== 'undefined') {
  window.__TEMPLATES__ = TEMPLATES;
}
