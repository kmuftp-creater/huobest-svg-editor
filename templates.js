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
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
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
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
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
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
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
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
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
// 範本 7：UML 類別圖
// ========================================
function buildUMLClass() {
  const objs = [];
  // 標題
  const title = _rect(420, 50, 360, 50, 'UML 類別圖', 'transparent', 'transparent', 24);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 抽象類別 Animal（最上層）
  const animX = 500, animY = 140;
  objs.push(_rect(animX, animY, 200, 32, 'Animal', '#F3E5F5', '#8E24AA', 16));
  objs.push(_rect(animX, animY + 32, 200, 50, '+ name: String\n+ age: int', '#FFFFFF', '#8E24AA', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });
  objs.push(_rect(animX, animY + 82, 200, 50, '+ eat()\n+ sleep()', '#FFFFFF', '#8E24AA', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });

  // Dog 類別（左下）
  const dogX = 240, dogY = 340;
  objs.push(_rect(dogX, dogY, 200, 32, 'Dog', '#E3F2FD', '#1565C0', 16));
  objs.push(_rect(dogX, dogY + 32, 200, 48, '+ breed: String', '#FFFFFF', '#1565C0', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });
  objs.push(_rect(dogX, dogY + 80, 200, 48, '+ bark()\n+ fetch()', '#FFFFFF', '#1565C0', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });

  // Cat 類別（右下）
  const catX = 760, catY = 340;
  objs.push(_rect(catX, catY, 200, 32, 'Cat', '#FFF3E0', '#E65100', 16));
  objs.push(_rect(catX, catY + 32, 200, 48, '+ color: String', '#FFFFFF', '#E65100', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });
  objs.push(_rect(catX, catY + 80, 200, 48, '+ meow()\n+ scratch()', '#FFFFFF', '#E65100', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });

  // 介面 Trainable（右上）
  const trX = 900, trY = 150;
  objs.push(_rect(trX, trY, 200, 32, '«interface»\nTrainable', '#E8F5E9', '#2E7D32', 12));
  objs.push(_rect(trX, trY + 32, 200, 60, '+ train(): void\n+ obey(): boolean', '#FFFFFF', '#2E7D32', 12));
  Object.assign(objs[objs.length - 1], { textAlign: 'left', textVAlign: 'top' });

  // 繼承箭頭 Dog -> Animal、Cat -> Animal
  objs.push(_arrow(340, 340, 540, 232, '#8E24AA', '繼承'));
  objs.push(_arrow(860, 340, 660, 232, '#8E24AA', '繼承'));
  // 實作 Dog -> Trainable
  objs.push(_arrow(440, 380, 900, 200, '#2E7D32', '實作'));

  // 說明文字
  const note = _rect(80, 600, 1040, 100,
    '說明：「+」表示 public 成員、「-」表示 private。實線箭頭代表繼承關係；虛線箭頭（«interface»）代表實作介面。',
    '#FFFDE7', '#FBC02D', 13);
  note.textAlign = 'left'; note.textVAlign = 'middle';
  objs.push(note);
  return objs;
}

// ========================================
// 範本 8：泳道圖（Swim Lane）
// ========================================
function buildSwimLane() {
  const objs = [];
  // 標題
  const title = _rect(400, 30, 400, 40, '跨部門協作泳道圖', 'transparent', 'transparent', 22);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 4 條泳道
  const lanes = [
    { name: '客戶',   fill: '#FFEBEE', stroke: '#E53935', y: 100, h: 140 },
    { name: '業務',   fill: '#E3F2FD', stroke: '#1E88E5', y: 240, h: 140 },
    { name: '工程',   fill: '#E8F5E9', stroke: '#43A047', y: 380, h: 140 },
    { name: '財務',   fill: '#FFF3E0', stroke: '#F57C00', y: 520, h: 140 },
  ];
  const laneX = 80, laneW = 1040, headerW = 100;
  lanes.forEach((lane) => {
    // 泳道標題（左側）
    objs.push(_rect(laneX, lane.y, headerW, lane.h, lane.name, lane.fill, lane.stroke, 18));
    objs[objs.length - 1].fontWeight = 'bold';
    // 泳道區（右側）
    objs.push(_rect(laneX + headerW, lane.y, laneW - headerW, lane.h, '', '#FAFAFA', lane.stroke, 12));
  });

  // 步驟方塊（依泳道）
  const stepW = 140, stepH = 60;
  // 客戶
  objs.push(_roundRect(220, 140, stepW, stepH, '提交需求', '#FFCDD2', '#E53935', 14));
  // 業務
  objs.push(_roundRect(400, 280, stepW, stepH, '需求確認', '#BBDEFB', '#1E88E5', 14));
  objs.push(_roundRect(600, 280, stepW, stepH, '報價', '#BBDEFB', '#1E88E5', 14));
  // 工程
  objs.push(_roundRect(800, 420, stepW, stepH, '設計開發', '#C8E6C9', '#43A047', 14));
  // 業務（客戶確認）
  objs.push(_roundRect(800, 280, stepW, stepH, '客戶確認', '#BBDEFB', '#1E88E5', 14));
  // 財務
  objs.push(_roundRect(960, 560, stepW, stepH, '請款收款', '#FFE0B2', '#F57C00', 14));
  // 客戶（驗收）
  objs.push(_roundRect(960, 140, stepW, stepH, '驗收', '#FFCDD2', '#E53935', 14));

  // 流程箭頭
  objs.push(_arrow(290, 200, 470, 280, '#6B7280'));
  objs.push(_arrow(540, 310, 600, 310, '#6B7280'));
  objs.push(_arrow(740, 310, 800, 310, '#6B7280'));
  objs.push(_arrow(870, 340, 870, 420, '#6B7280'));
  objs.push(_arrow(870, 480, 870, 280, '#6B7280'));
  objs.push(_arrow(940, 310, 1030, 200, '#6B7280'));
  objs.push(_arrow(1030, 200, 1030, 560, '#6B7280'));

  return objs;
}

// ========================================
// 範本 9：家族族譜（3 代）
// ========================================
function buildFamilyTree() {
  const objs = [];
  // 標題
  const title = _rect(400, 40, 400, 50, '家族族譜', 'transparent', 'transparent', 26);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 第 1 代（祖輩，最上）
  objs.push(_roundRect(420, 140, 160, 70, '祖父\n王 大明', '#E3F2FD', '#1565C0', 14));
  objs.push(_roundRect(620, 140, 160, 70, '祖母\n李 美芳', '#FFCDD2', '#E53935', 14));
  objs.push(_line(580, 175, 620, 175, '#9CA3AF'));  // 婚姻線

  // 第 2 代（父輩，中間 3 對）
  // 大伯+伯母
  objs.push(_roundRect(80, 320, 140, 70, '伯父\n王 大華', '#E3F2FD', '#1565C0', 13));
  objs.push(_roundRect(240, 320, 140, 70, '伯母\n陳 雅琴', '#FFCDD2', '#E53935', 13));
  objs.push(_line(220, 355, 240, 355, '#9CA3AF'));
  // 父+母
  objs.push(_roundRect(430, 320, 140, 70, '父親\n王 志強', '#E3F2FD', '#1565C0', 13));
  objs.push(_roundRect(590, 320, 140, 70, '母親\n林 慧君', '#FFCDD2', '#E53935', 13));
  objs.push(_line(570, 355, 590, 355, '#9CA3AF'));
  // 姑姑+姑丈
  objs.push(_roundRect(780, 320, 140, 70, '姑姑\n王 雪梅', '#FFCDD2', '#E53935', 13));
  objs.push(_roundRect(940, 320, 140, 70, '姑丈\n張 文彬', '#E3F2FD', '#1565C0', 13));
  objs.push(_line(920, 355, 940, 355, '#9CA3AF'));

  // 第 3 代（孫輩）
  const grandY = 530;
  // 伯父的孩子
  objs.push(_roundRect(60, grandY, 120, 60, '堂哥\n王 俊宏', '#E1BEE7', '#8E24AA', 12));
  objs.push(_roundRect(190, grandY, 120, 60, '堂妹\n王 雅婷', '#E1BEE7', '#8E24AA', 12));
  // 我這一輩
  objs.push(_roundRect(360, grandY, 120, 60, '哥哥\n王 建宇', '#E1BEE7', '#8E24AA', 12));
  objs.push(_roundRect(490, grandY, 120, 60, '我\n王 子瑜', '#FFF59D', '#F9A825', 13));
  objs[objs.length - 1].fontWeight = 'bold';
  objs.push(_roundRect(620, grandY, 120, 60, '妹妹\n王 思綺', '#E1BEE7', '#8E24AA', 12));
  // 姑姑的孩子
  objs.push(_roundRect(820, grandY, 120, 60, '表弟\n張 維倫', '#E1BEE7', '#8E24AA', 12));
  objs.push(_roundRect(950, grandY, 120, 60, '表妹\n張 妍秋', '#E1BEE7', '#8E24AA', 12));

  // 連接線（祖父母 -> 第二代）
  objs.push(_line(600, 210, 600, 250, '#9CA3AF'));
  objs.push(_line(170, 250, 1000, 250, '#9CA3AF'));
  objs.push(_line(170, 250, 170, 320, '#9CA3AF'));
  objs.push(_line(310, 250, 310, 320, '#9CA3AF'));
  objs.push(_line(500, 250, 500, 320, '#9CA3AF'));
  objs.push(_line(660, 250, 660, 320, '#9CA3AF'));
  objs.push(_line(850, 250, 850, 320, '#9CA3AF'));
  objs.push(_line(1000, 250, 1000, 320, '#9CA3AF'));
  // 第二代 -> 第三代
  objs.push(_line(220, 390, 220, 460, '#9CA3AF'));
  objs.push(_line(120, 460, 250, 460, '#9CA3AF'));
  objs.push(_line(120, 460, 120, 530, '#9CA3AF'));
  objs.push(_line(250, 460, 250, 530, '#9CA3AF'));
  objs.push(_line(500, 390, 500, 460, '#9CA3AF'));
  objs.push(_line(420, 460, 680, 460, '#9CA3AF'));
  objs.push(_line(420, 460, 420, 530, '#9CA3AF'));
  objs.push(_line(550, 460, 550, 530, '#9CA3AF'));
  objs.push(_line(680, 460, 680, 530, '#9CA3AF'));
  objs.push(_line(860, 390, 860, 460, '#9CA3AF'));
  objs.push(_line(880, 460, 1010, 460, '#9CA3AF'));
  objs.push(_line(880, 460, 880, 530, '#9CA3AF'));
  objs.push(_line(1010, 460, 1010, 530, '#9CA3AF'));
  return objs;
}

// ========================================
// 範本 10：行業分類樹
// ========================================
function buildIndustryTree() {
  const objs = [];
  // 根節點
  objs.push(_roundRect(500, 60, 200, 60, '產業分類', '#212121', '#212121', 18));
  objs[objs.length - 1].textColor = '#FFFFFF'; objs[objs.length - 1].fontWeight = 'bold';

  // 三大分類（第二層）
  const cats = [
    { name: '第一級產業', fill: '#C8E6C9', stroke: '#43A047', x: 100 },
    { name: '第二級產業', fill: '#BBDEFB', stroke: '#1E88E5', x: 500 },
    { name: '第三級產業', fill: '#E1BEE7', stroke: '#8E24AA', x: 900 },
  ];
  cats.forEach((c) => {
    objs.push(_roundRect(c.x, 200, 200, 60, c.name, c.fill, c.stroke, 16));
    objs[objs.length - 1].fontWeight = 'bold';
    // 連線
    objs.push(_line(600, 120, c.x + 100, 200, '#9CA3AF'));
  });

  // 第三層 子分類
  const subs = [
    // 第一級
    { parent: 0, x: 30,  text: '農業',     color: '#E8F5E9', stroke: '#81C784' },
    { parent: 0, x: 160, text: '林業',     color: '#E8F5E9', stroke: '#81C784' },
    { parent: 0, x: 290, text: '漁業',     color: '#E8F5E9', stroke: '#81C784' },
    // 第二級
    { parent: 1, x: 430, text: '製造業',   color: '#E3F2FD', stroke: '#64B5F6' },
    { parent: 1, x: 560, text: '建築業',   color: '#E3F2FD', stroke: '#64B5F6' },
    { parent: 1, x: 690, text: '能源業',   color: '#E3F2FD', stroke: '#64B5F6' },
    // 第三級
    { parent: 2, x: 830, text: '金融業',   color: '#F3E5F5', stroke: '#BA68C8' },
    { parent: 2, x: 960, text: '零售業',   color: '#F3E5F5', stroke: '#BA68C8' },
    { parent: 2, x: 1090, text: '服務業',  color: '#F3E5F5', stroke: '#BA68C8' },
  ];
  subs.forEach((s) => {
    objs.push(_roundRect(s.x, 340, 110, 50, s.text, s.color, s.stroke, 13));
    const parentX = cats[s.parent].x + 100;
    objs.push(_line(parentX, 260, s.x + 55, 340, '#9CA3AF'));
  });

  // 第四層 範例（服務業）
  const detail = [
    { x: 30,  text: '稻米' },
    { x: 160, text: '木材' },
    { x: 290, text: '養殖' },
    { x: 430, text: '電子' },
    { x: 560, text: '住宅' },
    { x: 690, text: '太陽能' },
    { x: 830, text: '銀行' },
    { x: 960, text: '百貨' },
    { x: 1090, text: '餐飲' },
  ];
  detail.forEach((d) => {
    objs.push(_rect(d.x + 10, 460, 90, 36, d.text, '#FAFAFA', '#9CA3AF', 12));
    objs.push(_line(d.x + 55, 390, d.x + 55, 460, '#9CA3AF'));
  });

  return objs;
}

// ========================================
// 範本 11：個人年度規劃
// ========================================
function buildPersonalPlan() {
  const objs = [];
  const title = _rect(400, 30, 400, 50, '2026 年度規劃', 'transparent', 'transparent', 26);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 中心：年度主題
  objs.push(_ellipse(490, 350, 220, 100, '年度主題\n持續學習', '#FFF59D', '#F9A825', 18));
  objs[objs.length - 1].fontWeight = 'bold';

  // 6 大領域（環繞中心）
  const areas = [
    { x: 80,   y: 120, name: '工作', detail: '• 完成 OKR\n• 新技能 ×2\n• 升職機會', fill: '#BBDEFB', stroke: '#1E88E5' },
    { x: 500,  y: 120, name: '健康', detail: '• 每週運動 3 次\n• 體重 -5kg\n• 飲食控制', fill: '#C8E6C9', stroke: '#43A047' },
    { x: 920,  y: 120, name: '財務', detail: '• 儲蓄 100k\n• 投資配置\n• 減少消費', fill: '#FFE0B2', stroke: '#F57C00' },
    { x: 80,   y: 540, name: '學習', detail: '• 讀書 ×12 本\n• 線上課程 ×3\n• 證照 ×1', fill: '#E1BEE7', stroke: '#8E24AA' },
    { x: 500,  y: 540, name: '關係', detail: '• 陪伴家人\n• 朋友聚會\n• 拓展人脈', fill: '#FFCDD2', stroke: '#E53935' },
    { x: 920,  y: 540, name: '興趣', detail: '• 攝影旅遊\n• 學習樂器\n• 創作部落格', fill: '#B2DFDB', stroke: '#00897B' },
  ];
  areas.forEach((a) => {
    objs.push(_roundRect(a.x, a.y, 200, 50, a.name, a.fill, a.stroke, 18));
    objs[objs.length - 1].fontWeight = 'bold';
    const det = _rect(a.x, a.y + 60, 200, 120, a.detail, '#FFFFFF', a.stroke, 13);
    det.textAlign = 'left'; det.textVAlign = 'top';
    objs.push(det);
    // 連線到中心
    objs.push(_line(a.x + 100, a.y + 50, 600, 400, a.stroke));
  });
  return objs;
}

// ========================================
// 範本 12：心智圖（中心 + 多層分支）
// 完整在 1200×800 畫布內，左右上下對稱
// ========================================
function buildMindMap() {
  const objs = [];
  // 中心節點（畫布中央）
  objs.push(_roundRect(525, 360, 150, 80, '專案規劃', '#FFF59D', '#F9A825', 22));
  objs[objs.length - 1].fontWeight = 'bold';

  // 4 大分支與其子節點
  const branches = [
    { name: '目標', x: 260, y: 110, color: '#BBDEFB', stroke: '#1E88E5', side: 'topLeft',
      subs: ['增加營收', '降低成本', '提升效率'] },
    { name: '人員', x: 800, y: 110, color: '#C8E6C9', stroke: '#43A047', side: 'topRight',
      subs: ['PM × 1', '工程 × 5', '設計 × 2'] },
    { name: '時程', x: 260, y: 640, color: '#FFE0B2', stroke: '#F57C00', side: 'bottomLeft',
      subs: ['Q1 規劃', 'Q2 開發', 'Q3 上線'] },
    { name: '預算', x: 800, y: 640, color: '#E1BEE7', stroke: '#8E24AA', side: 'bottomRight',
      subs: ['人事 60%', '設備 20%', '行銷 20%'] },
  ];

  const branchW = 140, branchH = 50;
  const subW = 110, subH = 32, subGap = 8;

  branches.forEach((b) => {
    // 一級分支節點
    objs.push(_roundRect(b.x, b.y, branchW, branchH, b.name, b.color, b.stroke, 18));
    objs[objs.length - 1].fontWeight = 'bold';
    // 中心連線
    const branchCx = b.x + branchW / 2;
    const branchCy = b.y + branchH / 2;
    objs.push(_line(branchCx, branchCy, 600, 400, b.stroke));

    // 二級子節點：左側分支放在分支「左邊」，右側分支放在分支「右邊」
    // Y 軸依分支位置決定（上方分支往下排，下方分支往上排）
    const isLeft = b.side === 'topLeft' || b.side === 'bottomLeft';
    const isTop  = b.side === 'topLeft' || b.side === 'topRight';
    const subX = isLeft ? b.x - subW - 30 : b.x + branchW + 30;
    const subTotalH = b.subs.length * (subH + subGap) - subGap;
    // 子節點區塊垂直置中對齊分支中心
    const subY0 = b.y + branchH / 2 - subTotalH / 2;

    b.subs.forEach((s, i) => {
      const sy = subY0 + i * (subH + subGap);
      objs.push(_roundRect(subX, sy, subW, subH, s, '#FFFFFF', b.stroke, 12));
      // 子節點 → 一級分支：水平直線連接
      const lineFromX = isLeft ? subX + subW : subX;
      const lineToX   = isLeft ? b.x         : b.x + branchW;
      objs.push(_line(lineFromX, sy + subH / 2, lineToX, branchCy, b.stroke));
    });
  });
  return objs;
}

// ========================================
// 範本 13：概念圖（5W1H）
// ========================================
function buildConcept5W1H() {
  const objs = [];
  const title = _rect(400, 30, 400, 50, '5W1H 分析法', 'transparent', 'transparent', 24);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 中心
  objs.push(_ellipse(490, 350, 220, 100, '事件 / 議題', '#212121', '#212121', 18));
  objs[objs.length - 1].textColor = '#FFFFFF'; objs[objs.length - 1].fontWeight = 'bold';

  // 6 個 W/H
  const ws = [
    { en: 'WHY',   zh: '為什麼', desc: '目的與動機', x: 100,  y: 120, color: '#FFCDD2', stroke: '#E53935' },
    { en: 'WHAT',  zh: '是什麼', desc: '對象與內容', x: 500,  y: 100, color: '#FFE0B2', stroke: '#F57C00' },
    { en: 'WHO',   zh: '誰',     desc: '相關人物',   x: 900,  y: 120, color: '#FFF59D', stroke: '#F9A825' },
    { en: 'WHEN',  zh: '何時',   desc: '時間點',     x: 100,  y: 540, color: '#C8E6C9', stroke: '#43A047' },
    { en: 'WHERE', zh: '何地',   desc: '地點',       x: 500,  y: 560, color: '#BBDEFB', stroke: '#1E88E5' },
    { en: 'HOW',   zh: '如何',   desc: '方法步驟',   x: 900,  y: 540, color: '#E1BEE7', stroke: '#8E24AA' },
  ];
  ws.forEach((w) => {
    // 主框
    objs.push(_roundRect(w.x, w.y, 200, 80, w.en + '\n' + w.zh, w.color, w.stroke, 18));
    objs[objs.length - 1].fontWeight = 'bold';
    // 副框
    const sub = _rect(w.x, w.y + 90, 200, 90, w.desc + '\n\n（在此填入內容）', '#FFFFFF', w.stroke, 13);
    sub.textColor = '#4B5563';
    objs.push(sub);
    // 連線
    objs.push(_line(w.x + 100, w.y + 40, 600, 400, w.stroke));
  });
  return objs;
}

// ========================================
// 範本 14：甘特圖
// ========================================
function buildGantt() {
  const objs = [];
  const title = _rect(400, 30, 400, 50, '專案甘特圖', 'transparent', 'transparent', 24);
  title.strokeEnabled = false; title.fillEnabled = false;
  title.textColor = 'currentColor'; title.fontWeight = 'bold';
  objs.push(title);

  // 表頭欄位
  const startX = 60, headerY = 110;
  const colTask = 200;
  const colMonth = 70;
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  // 任務欄表頭
  objs.push(_rect(startX, headerY, colTask, 40, '任務名稱', '#212121', '#212121', 14));
  objs[objs.length - 1].textColor = '#FFFFFF'; objs[objs.length - 1].fontWeight = 'bold';
  // 月份表頭
  months.forEach((m, i) => {
    objs.push(_rect(startX + colTask + i * colMonth, headerY, colMonth, 40, m, '#424242', '#424242', 12));
    objs[objs.length - 1].textColor = '#FFFFFF';
  });

  // 任務列
  const tasks = [
    { name: '需求調查',   from: 0, to: 1, color: '#BBDEFB', stroke: '#1E88E5' },
    { name: '系統設計',   from: 1, to: 3, color: '#C8E6C9', stroke: '#43A047' },
    { name: '前端開發',   from: 2, to: 6, color: '#FFE0B2', stroke: '#F57C00' },
    { name: '後端開發',   from: 2, to: 7, color: '#FFCDD2', stroke: '#E53935' },
    { name: '整合測試',   from: 6, to: 8, color: '#E1BEE7', stroke: '#8E24AA' },
    { name: '使用者測試', from: 8, to: 9, color: '#FFF59D', stroke: '#F9A825' },
    { name: '上線部署',   from: 9, to: 10, color: '#B2DFDB', stroke: '#00897B' },
    { name: '維護優化',   from: 10, to: 12, color: '#90CAF9', stroke: '#1565C0' },
  ];
  const rowH = 40;
  tasks.forEach((t, i) => {
    const y = headerY + 40 + i * rowH;
    // 任務名稱
    objs.push(_rect(startX, y, colTask, rowH, t.name, '#FAFAFA', '#9CA3AF', 13));
    objs[objs.length - 1].textAlign = 'left';
    // 月份背景格
    for (let m = 0; m < 12; m++) {
      objs.push(_rect(startX + colTask + m * colMonth, y, colMonth, rowH, '', '#FFFFFF', '#E5E7EB', 10));
    }
    // 任務時間條
    const barX = startX + colTask + t.from * colMonth + 4;
    const barW = (t.to - t.from) * colMonth - 8;
    objs.push(_roundRect(barX, y + 8, barW, rowH - 16, '', t.color, t.stroke, 11));
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
  {
    id: 'uml-class',
    name: 'UML 類別圖',
    category: 'UML',
    thumb: `
      <rect x="40" y="6" width="22" height="6" fill="#F3E5F5" stroke="currentColor" stroke-width="0.3"/>
      <rect x="40" y="12" width="22" height="6" fill="#fff" stroke="currentColor" stroke-width="0.3"/>
      <rect x="40" y="18" width="22" height="6" fill="#fff" stroke="currentColor" stroke-width="0.3"/>
      <rect x="10" y="36" width="22" height="6" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3"/>
      <rect x="10" y="42" width="22" height="6" fill="#fff" stroke="currentColor" stroke-width="0.3"/>
      <rect x="70" y="36" width="22" height="6" fill="#FFF3E0" stroke="currentColor" stroke-width="0.3"/>
      <rect x="70" y="42" width="22" height="6" fill="#fff" stroke="currentColor" stroke-width="0.3"/>
      <line x1="21" y1="36" x2="46" y2="24" stroke="currentColor" stroke-width="0.4"/>
      <line x1="81" y1="36" x2="56" y2="24" stroke="currentColor" stroke-width="0.4"/>
    `,
    build: buildUMLClass,
  },
  {
    id: 'swim-lane',
    name: '泳道圖',
    category: '流程',
    thumb: `
      <rect x="6" y="8"  width="14" height="11" fill="#FFEBEE" stroke="currentColor" stroke-width="0.3"/>
      <rect x="20" y="8" width="74" height="11" fill="#FAFAFA" stroke="currentColor" stroke-width="0.3"/>
      <rect x="6" y="19" width="14" height="11" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3"/>
      <rect x="20" y="19" width="74" height="11" fill="#FAFAFA" stroke="currentColor" stroke-width="0.3"/>
      <rect x="6" y="30" width="14" height="11" fill="#E8F5E9" stroke="currentColor" stroke-width="0.3"/>
      <rect x="20" y="30" width="74" height="11" fill="#FAFAFA" stroke="currentColor" stroke-width="0.3"/>
      <rect x="6" y="41" width="14" height="11" fill="#FFF3E0" stroke="currentColor" stroke-width="0.3"/>
      <rect x="20" y="41" width="74" height="11" fill="#FAFAFA" stroke="currentColor" stroke-width="0.3"/>
      <rect x="24" y="10" width="14" height="7" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="44" y="21" width="14" height="7" fill="#BBDEFB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="64" y="32" width="14" height="7" fill="#C8E6C9" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="78" y="43" width="14" height="7" fill="#FFE0B2" stroke="currentColor" stroke-width="0.3" rx="1"/>
    `,
    build: buildSwimLane,
  },
  {
    id: 'family-tree',
    name: '家族族譜',
    category: '結構',
    thumb: `
      <rect x="32" y="6"  width="16" height="7" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="52" y="6"  width="16" height="7" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <line x1="48" y1="10" x2="52" y2="10" stroke="currentColor" stroke-width="0.3"/>
      <rect x="6"  y="24" width="14" height="7" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="22" y="24" width="14" height="7" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="42" y="24" width="14" height="7" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="58" y="24" width="14" height="7" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="78" y="24" width="14" height="7" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="6"  y="44" width="10" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="18" y="44" width="10" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="40" y="44" width="10" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="52" y="44" width="10" height="6" fill="#FFF59D" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="64" y="44" width="10" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="80" y="44" width="10" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
    `,
    build: buildFamilyTree,
  },
  {
    id: 'industry-tree',
    name: '行業分類',
    category: '結構',
    thumb: `
      <rect x="42" y="4"  width="16" height="6" fill="#212121" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="10" y="18" width="20" height="6" fill="#C8E6C9" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="40" y="18" width="20" height="6" fill="#BBDEFB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="70" y="18" width="20" height="6" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="6"  y="32" width="9"  height="5" fill="#E8F5E9" stroke="currentColor" stroke-width="0.3"/>
      <rect x="16" y="32" width="9"  height="5" fill="#E8F5E9" stroke="currentColor" stroke-width="0.3"/>
      <rect x="36" y="32" width="9"  height="5" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3"/>
      <rect x="46" y="32" width="9"  height="5" fill="#E3F2FD" stroke="currentColor" stroke-width="0.3"/>
      <rect x="66" y="32" width="9"  height="5" fill="#F3E5F5" stroke="currentColor" stroke-width="0.3"/>
      <rect x="76" y="32" width="9"  height="5" fill="#F3E5F5" stroke="currentColor" stroke-width="0.3"/>
      <line x1="50" y1="10" x2="20" y2="18" stroke="currentColor" stroke-width="0.3"/>
      <line x1="50" y1="10" x2="50" y2="18" stroke="currentColor" stroke-width="0.3"/>
      <line x1="50" y1="10" x2="80" y2="18" stroke="currentColor" stroke-width="0.3"/>
    `,
    build: buildIndustryTree,
  },
  {
    id: 'personal-plan',
    name: '年度規劃',
    category: '個人',
    thumb: `
      <ellipse cx="50" cy="30" rx="14" ry="8" fill="#FFF59D" stroke="currentColor" stroke-width="0.4"/>
      <rect x="6"  y="6"  width="18" height="9" fill="#BBDEFB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="42" y="6"  width="18" height="9" fill="#C8E6C9" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="76" y="6"  width="18" height="9" fill="#FFE0B2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="6"  y="44" width="18" height="9" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="42" y="44" width="18" height="9" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="76" y="44" width="18" height="9" fill="#B2DFDB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <line x1="15" y1="15" x2="42" y2="26" stroke="currentColor" stroke-width="0.3"/>
      <line x1="51" y1="15" x2="50" y2="22" stroke="currentColor" stroke-width="0.3"/>
      <line x1="85" y1="15" x2="58" y2="26" stroke="currentColor" stroke-width="0.3"/>
      <line x1="15" y1="44" x2="42" y2="35" stroke="currentColor" stroke-width="0.3"/>
      <line x1="51" y1="44" x2="50" y2="38" stroke="currentColor" stroke-width="0.3"/>
      <line x1="85" y1="44" x2="58" y2="35" stroke="currentColor" stroke-width="0.3"/>
    `,
    build: buildPersonalPlan,
  },
  {
    id: 'mind-map',
    name: '心智圖',
    category: '思考',
    thumb: `
      <rect x="38" y="24" width="24" height="12" fill="#FFF59D" stroke="currentColor" stroke-width="0.4" rx="2"/>
      <rect x="6"  y="6"  width="20" height="8" fill="#BBDEFB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="74" y="6"  width="20" height="8" fill="#C8E6C9" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="6"  y="46" width="20" height="8" fill="#FFE0B2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="74" y="46" width="20" height="8" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <line x1="26" y1="10" x2="42" y2="28" stroke="currentColor" stroke-width="0.3"/>
      <line x1="74" y1="10" x2="58" y2="28" stroke="currentColor" stroke-width="0.3"/>
      <line x1="26" y1="50" x2="42" y2="34" stroke="currentColor" stroke-width="0.3"/>
      <line x1="74" y1="50" x2="58" y2="34" stroke="currentColor" stroke-width="0.3"/>
    `,
    build: buildMindMap,
  },
  {
    id: 'concept-5w1h',
    name: '5W1H 分析',
    category: '思考',
    thumb: `
      <ellipse cx="50" cy="30" rx="14" ry="7" fill="#212121" stroke="currentColor" stroke-width="0.3"/>
      <rect x="6"  y="6"  width="18" height="9" fill="#FFCDD2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="42" y="4"  width="18" height="9" fill="#FFE0B2" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="76" y="6"  width="18" height="9" fill="#FFF59D" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="6"  y="46" width="18" height="9" fill="#C8E6C9" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="42" y="48" width="18" height="9" fill="#BBDEFB" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <rect x="76" y="46" width="18" height="9" fill="#E1BEE7" stroke="currentColor" stroke-width="0.3" rx="1"/>
      <text x="15" y="13" font-size="4" fill="currentColor" font-weight="700">WHY</text>
      <text x="50" y="11" font-size="3" fill="currentColor" font-weight="700" text-anchor="middle">WHAT</text>
      <text x="85" y="13" font-size="4" fill="currentColor" font-weight="700" text-anchor="middle">WHO</text>
    `,
    build: buildConcept5W1H,
  },
  {
    id: 'gantt',
    name: '甘特圖',
    category: '時序',
    thumb: `
      <rect x="6"  y="6"  width="22" height="6" fill="#212121"/>
      <rect x="28" y="6"  width="66" height="6" fill="#424242"/>
      <rect x="6"  y="14" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="30" y="15" width="10" height="3" fill="#BBDEFB" stroke="currentColor" stroke-width="0.2"/>
      <rect x="6"  y="20" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="36" y="21" width="20" height="3" fill="#C8E6C9" stroke="currentColor" stroke-width="0.2"/>
      <rect x="6"  y="26" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="42" y="27" width="30" height="3" fill="#FFE0B2" stroke="currentColor" stroke-width="0.2"/>
      <rect x="6"  y="32" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="42" y="33" width="36" height="3" fill="#FFCDD2" stroke="currentColor" stroke-width="0.2"/>
      <rect x="6"  y="38" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="64" y="39" width="14" height="3" fill="#E1BEE7" stroke="currentColor" stroke-width="0.2"/>
      <rect x="6"  y="44" width="22" height="5" fill="#FAFAFA" stroke="currentColor" stroke-width="0.2"/>
      <rect x="76" y="45" width="14" height="3" fill="#FFF59D" stroke="currentColor" stroke-width="0.2"/>
    `,
    build: buildGantt,
  },
];

if (typeof window !== 'undefined') {
  window.__TEMPLATES__ = TEMPLATES;
}
