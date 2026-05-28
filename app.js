/* =============================================================
   霍家私塾 SVG 編輯器 - 應用程式核心
   架構：
   - state：扁平化儲存所有物件（id → node）
   - render：將 state 寫回 SVG DOM
   - history：操作堆疊（最多 50 筆）
   - selection / transform：選取與變形
   - propertyPanel：右側面板雙向綁定
   ============================================================= */

(function () {
  'use strict';

  // ====== Constants ======
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XHTML_NS = 'http://www.w3.org/1999/xhtml';
  const HISTORY_LIMIT = 50;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 8;
  const ZOOM_STEP = 1.15;
  const CANVAS_W = 1200;
  const CANVAS_H = 800;

  // ====== State ======
  const state = {
    objects: [],         // 物件陣列（保留順序，索引大者在上層）
    selected: new Set(), // 選取的 id
    tool: 'select',
    zoom: 1,
    autoCounter: 0,      // 自動編號計數
    history: [],
    historyIndex: -1,
    clipboard: null,
    snapToGrid: false,
    gridSize: 10,
    smartGuides: [],   // 對齊輔助線（暫存渲染用）
    groupCounter: 0,   // 群組 ID 計數
  };

  // ====== DOM References ======
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const stage = $('#stage');
  const layerRoot = $('#layer-root');
  const overlay = $('#overlay');
  const canvasHost = $('#canvas-host');
  const statusCoord = $('#status-coord');
  const statusInfo = $('#status-info');
  const statusSel = $('#status-selection');
  const layerList = $('#layer-list');
  const historyList = $('#history-list');
  const dropOverlay = $('#drop-overlay');
  const textContentInput = $('#text-content-input');
  const textContentHint = $('#text-content-hint');

  // ====== Utility ======
  function uid(prefix) {
    state.autoCounter += 1;
    const n = String(state.autoCounter).padStart(2, '0');
    return `${prefix || 'item'}-${n}`;
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function snap(v) { return state.snapToGrid ? Math.round(v / state.gridSize) * state.gridSize : v; }
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  // ====== Object Factory ======
  function createObject(type, props) {
    const id = props.id || uid('item');
    const base = {
      id,
      type,
      x: props.x ?? 100,
      y: props.y ?? 100,
      w: props.w ?? 120,
      h: props.h ?? 80,
      rotation: 0,
      flipH: false,
      flipV: false,
      opacity: 1,
      fill: props.fill ?? '#FFFFFF',
      fillEnabled: true,
      stroke: props.stroke ?? '#333333',
      strokeEnabled: true,
      strokeWidth: 1.5,
      strokeStyle: 'solid', // solid / dash / dot / dashdot
      shadow: false,
      sketch: false,
      locked: false,
      name: props.name || type,
      // 文字屬性
      text: props.text || '',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',     // left / center / right
      textVAlign: 'middle',    // top / middle / bottom
      textColor: '#1F2937',
      // shape 特定資料
      shapeId: props.shapeId || null,
      shapeSvg: props.shapeSvg || null,
      imgHref: props.imgHref || null,
      preserveStyle: props.preserveStyle || false, // 匯入時保留原始顏色
      shapeViewBox: props.shapeViewBox || null,    // { x, y, w, h } for compound shapes
      groupId: props.groupId || null,              // 群組 ID
      useForeignObject: props.useForeignObject || false,
      // Ghost 文字物件：視覺由所屬 compound shape 的 foreignObject 提供，自身只負責 hit-test 與編輯介面
      // 結構：{ compoundId: string, foreignIndex: number }
      ghostFor: props.ghostFor || null,
    };
    return base;
  }

  // ====== 群組輔助 ======
  function expandSelectionByGroups() {
    // 將選取集擴張至所有同 groupId 成員
    const ids = new Set(state.selected);
    const groups = new Set();
    ids.forEach((id) => {
      const o = findObj(id);
      if (o && o.groupId) groups.add(o.groupId);
    });
    state.objects.forEach((o) => {
      if (o.groupId && groups.has(o.groupId)) ids.add(o.id);
    });
    state.selected = ids;
  }
  function getGroupBBox(groupId) {
    const objs = state.objects.filter((o) => o.groupId === groupId);
    if (objs.length === 0) return null;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    objs.forEach((o) => {
      x1 = Math.min(x1, o.x);
      y1 = Math.min(y1, o.y);
      x2 = Math.max(x2, o.x + o.w);
      y2 = Math.max(y2, o.y + o.h);
    });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  // ====== History ======
  function pushHistory(action, meta) {
    // 截斷未來
    state.history = state.history.slice(0, state.historyIndex + 1);
    const snapshot = state.objects.map(deepClone);
    state.history.push({ action, meta: meta || '', snapshot, ts: Date.now() });
    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    } else {
      state.historyIndex += 1;
    }
    renderHistory();
  }
  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex -= 1;
    state.objects = state.history[state.historyIndex].snapshot.map(deepClone);
    state.selected.clear();
    renderAll();
  }
  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex += 1;
    state.objects = state.history[state.historyIndex].snapshot.map(deepClone);
    state.selected.clear();
    renderAll();
  }

  // ====== Rendering ======
  function renderAll() {
    layerRoot.innerHTML = '';
    state.objects.forEach((obj) => {
      const el = renderObject(obj);
      if (el) layerRoot.appendChild(el);
    });
    renderOverlay();
    renderLayers();
    syncPropertyPanel();
  }

  function renderObject(obj) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-id', obj.id);
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const sx = obj.flipH ? -1 : 1;
    const sy = obj.flipV ? -1 : 1;
    g.setAttribute('transform', `translate(${cx} ${cy}) rotate(${obj.rotation}) scale(${sx} ${sy}) translate(${-obj.w / 2} ${-obj.h / 2})`);
    g.setAttribute('opacity', obj.opacity);
    // 隱藏（opacity 0）物件不應攔截點擊事件，避免遮蔽下層可見物件
    if (obj.opacity === 0) g.setAttribute('pointer-events', 'none');
    if (obj.shadow) g.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))');
    if (obj.locked) g.setAttribute('data-locked', 'true');

    const shape = buildShape(obj);
    if (shape) g.appendChild(shape);

    // 內嵌文字（除了 text-only 類型）
    if (obj.text && obj.type !== 'image') {
      const txt = buildTextNode(obj);
      if (txt) g.appendChild(txt);
    }

    return g;
  }

  function buildShape(obj) {
    const strokeAttr = obj.strokeEnabled ? obj.stroke : 'none';
    const fillAttr = obj.fillEnabled ? obj.fill : 'none';
    const sw = obj.strokeWidth;
    let dasharray = '';
    if (obj.strokeStyle === 'dash') dasharray = '6 4';
    else if (obj.strokeStyle === 'dot') dasharray = '1 4';
    else if (obj.strokeStyle === 'dashdot') dasharray = '6 3 1 3';

    const applyStroke = (el) => {
      el.setAttribute('fill', fillAttr);
      el.setAttribute('stroke', strokeAttr);
      el.setAttribute('stroke-width', sw);
      if (dasharray) el.setAttribute('stroke-dasharray', dasharray);
    };

    if (obj.type === 'rect') {
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', 0); r.setAttribute('y', 0);
      r.setAttribute('width', obj.w); r.setAttribute('height', obj.h);
      r.setAttribute('rx', obj.rx || 0);
      applyStroke(r);
      return r;
    }
    if (obj.type === 'ellipse' || obj.type === 'circle') {
      const e = document.createElementNS(SVG_NS, 'ellipse');
      e.setAttribute('cx', obj.w / 2); e.setAttribute('cy', obj.h / 2);
      e.setAttribute('rx', obj.w / 2); e.setAttribute('ry', obj.h / 2);
      applyStroke(e);
      return e;
    }
    if (obj.type === 'line') {
      const l = document.createElementNS(SVG_NS, 'line');
      l.setAttribute('x1', 0); l.setAttribute('y1', obj.h / 2);
      l.setAttribute('x2', obj.w); l.setAttribute('y2', obj.h / 2);
      applyStroke(l);
      l.setAttribute('fill', 'none');
      return l;
    }
    if (obj.type === 'text') {
      // text-only：使用透明矩形作為點擊命中區域，讓選取與雙擊編輯可正常運作
      const hit = document.createElementNS(SVG_NS, 'rect');
      hit.setAttribute('x', 0); hit.setAttribute('y', 0);
      hit.setAttribute('width', obj.w); hit.setAttribute('height', obj.h);
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('pointer-events', 'all');
      return hit;
    }
    if (obj.type === 'image') {
      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttribute('x', 0); img.setAttribute('y', 0);
      img.setAttribute('width', obj.w); img.setAttribute('height', obj.h);
      img.setAttribute('href', obj.imgHref || '');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', obj.imgHref || '');
      return img;
    }
    if (obj.type === 'shape' && obj.shapeSvg) {
      // 形狀庫 / 匯入的複合 SVG：以縮放方式繪製到 0..w / 0..h
      const wrap = document.createElementNS(SVG_NS, 'g');
      const inner = document.createElementNS(SVG_NS, 'g');
      const vb = obj.shapeViewBox || { x: 0, y: 0, w: 100, h: 60 };
      const sx = obj.w / vb.w;
      const sy = obj.h / vb.h;
      inner.setAttribute('transform', `scale(${sx} ${sy}) translate(${-vb.x} ${-vb.y})`);
      const tmp = document.createElementNS(SVG_NS, 'g');
      tmp.innerHTML = obj.shapeSvg;
      if (!obj.preserveStyle) {
        tmp.querySelectorAll('*').forEach((el) => {
          if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.setAttribute('fill', fillAttr);
          if (el.hasAttribute('stroke')) el.setAttribute('stroke', strokeAttr);
          if (el.hasAttribute('stroke-width')) el.setAttribute('stroke-width', sw / Math.max(0.01, Math.min(sx, sy)));
          if (dasharray) el.setAttribute('stroke-dasharray', dasharray);
        });
      }
      while (tmp.firstChild) inner.appendChild(tmp.firstChild);
      wrap.appendChild(inner);
      return wrap;
    }
    return null;
  }

  function buildTextNode(obj) {
    // Ghost 物件：視覺由 compound shape 的 foreignObject 提供，自身不渲染文字
    if (obj.ghostFor) return null;

    // foreignObject 模式：保留給未來需求；目前 draw.io 匯入改走 ghost 架構
    if (obj.useForeignObject) {
      const fo = document.createElementNS(SVG_NS, 'foreignObject');
      fo.setAttribute('x', 0);
      fo.setAttribute('y', 0);
      fo.setAttribute('width', obj.w);
      fo.setAttribute('height', obj.h);
      fo.setAttribute('overflow', 'hidden');
      fo.setAttribute('pointer-events', 'none');
      fo.setAttribute('style', 'overflow:hidden');
      const div = document.createElementNS(XHTML_NS, 'div');
      div.setAttribute('xmlns', XHTML_NS);
      const justifyMap = { left: 'flex-start', right: 'flex-end', center: 'center' };
      const alignMap   = { top: 'flex-start', bottom: 'flex-end', middle: 'center' };
      div.setAttribute('style', [
        'width:100%',
        'height:100%',
        'box-sizing:border-box',
        'display:flex',
        `align-items:${alignMap[obj.textVAlign] || 'center'}`,
        `justify-content:${justifyMap[obj.textAlign] || 'center'}`,
        `font-family:${obj.fontFamily}`,
        `font-size:${obj.fontSize}px`,
        `font-weight:${obj.fontWeight}`,
        `font-style:${obj.fontStyle}`,
        `color:${obj.textColor}`,
        'line-height:1.2',
        `text-align:${obj.textAlign}`,
        'white-space:pre-wrap',
        'word-break:break-all',         // 連續中文字串也強制斷字
        'overflow-wrap:anywhere',
        'overflow:hidden',
        'padding:1px 2px',
      ].join(';'));
      div.textContent = String(obj.text || '');
      fo.appendChild(div);
      return fo;
    }

    // 標準 SVG <text> 模式
    const txt = document.createElementNS(SVG_NS, 'text');
    let tx, ty, anchor, baseline;
    switch (obj.textAlign) {
      case 'left':   anchor = 'start';  tx = 6; break;
      case 'right':  anchor = 'end';    tx = obj.w - 6; break;
      default:       anchor = 'middle'; tx = obj.w / 2;
    }
    switch (obj.textVAlign) {
      case 'top':    baseline = 'hanging';      ty = 6; break;
      case 'bottom': baseline = 'alphabetic';   ty = obj.h - 8; break;
      default:       baseline = 'middle';       ty = obj.h / 2;
    }
    txt.setAttribute('x', tx);
    txt.setAttribute('y', ty);
    txt.setAttribute('text-anchor', anchor);
    txt.setAttribute('dominant-baseline', baseline);
    txt.setAttribute('font-family', obj.fontFamily);
    txt.setAttribute('font-size', obj.fontSize);
    txt.setAttribute('font-weight', obj.fontWeight);
    txt.setAttribute('font-style', obj.fontStyle);
    if (obj.textDecoration !== 'none') txt.setAttribute('text-decoration', obj.textDecoration);
    txt.setAttribute('fill', obj.textColor);
    txt.setAttribute('pointer-events', 'none');

    const lines = String(obj.text).split('\n');
    lines.forEach((line, i) => {
      const ts = document.createElementNS(SVG_NS, 'tspan');
      ts.setAttribute('x', tx);
      if (i === 0) ts.setAttribute('dy', '0');
      else ts.setAttribute('dy', obj.fontSize * 1.25);
      ts.textContent = line;
      txt.appendChild(ts);
    });
    return txt;
  }

  // ====== Overlay (Selection box + handles + smart guides + group rect) ======
  function renderOverlay() {
    overlay.innerHTML = '';
    // 群組外框
    const groupsShown = new Set();
    state.selected.forEach((id) => {
      const o = findObj(id);
      if (o && o.groupId && !groupsShown.has(o.groupId)) {
        groupsShown.add(o.groupId);
        const bb = getGroupBBox(o.groupId);
        if (bb) {
          const gr = document.createElementNS(SVG_NS, 'rect');
          gr.setAttribute('class', 'group-rect');
          gr.setAttribute('x', bb.x - 4); gr.setAttribute('y', bb.y - 4);
          gr.setAttribute('width', bb.w + 8); gr.setAttribute('height', bb.h + 8);
          overlay.appendChild(gr);
        }
      }
    });
    // 智慧對齊輔助線
    state.smartGuides.forEach((g) => {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'smart-guide');
      line.setAttribute('x1', g.x1); line.setAttribute('y1', g.y1);
      line.setAttribute('x2', g.x2); line.setAttribute('y2', g.y2);
      overlay.appendChild(line);
    });
    if (state.selected.size === 0) return;
    const ids = Array.from(state.selected);
    ids.forEach((id) => {
      const obj = findObj(id);
      if (!obj) return;
      const box = document.createElementNS(SVG_NS, 'rect');
      box.setAttribute('class', 'selection-rect');
      box.setAttribute('x', obj.x);
      box.setAttribute('y', obj.y);
      box.setAttribute('width', obj.w);
      box.setAttribute('height', obj.h);
      box.setAttribute('transform', `rotate(${obj.rotation} ${obj.x + obj.w/2} ${obj.y + obj.h/2})`);
      if (obj.ghostFor) box.classList.add('ghost-select');
      overlay.appendChild(box);

      // Ghost 物件：不渲染縮放與旋轉控點（避免誤以為可以縮放）
      // 編輯文字請於右側「文字」分頁；縮放整張匯入請點 compound（非文字區）
      if (obj.ghostFor) return;

      // 8 個縮放點 + 1 個旋轉點
      const positions = [
        ['nw', obj.x, obj.y],
        ['n',  obj.x + obj.w / 2, obj.y],
        ['ne', obj.x + obj.w, obj.y],
        ['e',  obj.x + obj.w, obj.y + obj.h / 2],
        ['se', obj.x + obj.w, obj.y + obj.h],
        ['s',  obj.x + obj.w / 2, obj.y + obj.h],
        ['sw', obj.x, obj.y + obj.h],
        ['w',  obj.x, obj.y + obj.h / 2],
      ];
      positions.forEach(([dir, hx, hy]) => {
        const handle = document.createElementNS(SVG_NS, 'rect');
        handle.setAttribute('class', `handle h-${dir}`);
        handle.setAttribute('x', hx - 4);
        handle.setAttribute('y', hy - 4);
        handle.setAttribute('width', 8);
        handle.setAttribute('height', 8);
        handle.setAttribute('data-handle', dir);
        handle.setAttribute('data-id', obj.id);
        handle.setAttribute('transform', `rotate(${obj.rotation} ${obj.x + obj.w/2} ${obj.y + obj.h/2})`);
        overlay.appendChild(handle);
      });
      // Rotation handle
      const rh = document.createElementNS(SVG_NS, 'circle');
      rh.setAttribute('class', 'handle h-rotate');
      rh.setAttribute('cx', obj.x + obj.w / 2);
      rh.setAttribute('cy', obj.y - 20);
      rh.setAttribute('r', 5);
      rh.setAttribute('data-handle', 'rotate');
      rh.setAttribute('data-id', obj.id);
      rh.setAttribute('transform', `rotate(${obj.rotation} ${obj.x + obj.w/2} ${obj.y + obj.h/2})`);
      overlay.appendChild(rh);
    });
  }

  function findObj(id) { return state.objects.find((o) => o.id === id); }

  // ====== 取得 compound shape 的所有 ghost 文字物件原始狀態 ======
  // 用於 compound 移動 / 縮放時讓 ghost 同步變形
  function captureGhostsForCompounds(compoundIds) {
    const set = new Set(compoundIds);
    const result = [];
    state.objects.forEach((o) => {
      if (o.ghostFor && set.has(o.ghostFor.compoundId)) {
        result.push({
          id: o.id,
          compoundId: o.ghostFor.compoundId,
          x: o.x, y: o.y, w: o.w, h: o.h,
          fontSize: o.fontSize,
        });
      }
    });
    return result;
  }
  // 將 dx, dy 套用至所有 ghost（用於 move）
  function applyGhostTranslate(ghostOrigs, dx, dy) {
    ghostOrigs.forEach((g) => {
      const o = findObj(g.id);
      if (!o) return;
      o.x = g.x + dx;
      o.y = g.y + dy;
    });
  }
  // 將縮放套用至所有 ghost（用於 resize）
  // origCompound: 縮放前的 compound 物件（含 x, y, w, h）
  // newCompound: 縮放後的 compound 物件
  function applyGhostScale(ghostOrigs, origCompound, newCompound) {
    if (!origCompound.w || !origCompound.h) return;
    const sx = newCompound.w / origCompound.w;
    const sy = newCompound.h / origCompound.h;
    ghostOrigs.forEach((g) => {
      if (g.compoundId !== origCompound.id) return;
      const o = findObj(g.id);
      if (!o) return;
      const relX = g.x - origCompound.x;
      const relY = g.y - origCompound.y;
      o.x = newCompound.x + relX * sx;
      o.y = newCompound.y + relY * sy;
      o.w = g.w * sx;
      o.h = g.h * sy;
      o.fontSize = Math.max(4, g.fontSize * Math.min(sx, sy));
    });
  }

  // ====== 更新 compound shape 內第 N 個 foreignObject 的文字內容 ======
  // 用於 ghost 文字物件與 compound shape 雙向綁定
  //
  // 重要：必須使用 DOMParser 在 SVG 命名空間下解析，否則 HTML parser 會把
  // <linearGradient> 等大小寫敏感的 SVG 元素全部小寫化為 <lineargradient>，
  // 序列化後 SVG 找不到漸層定義 → 整個 compound 的填色都消失。
  function updateCompoundForeignText(compoundId, foreignIndex, newText) {
    const compound = findObj(compoundId);
    if (!compound || !compound.shapeSvg) return false;

    // 用 <svg> 包裹後以 XML 模式解析
    const wrapped = `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink">${compound.shapeSvg}</svg>`;
    let doc;
    try {
      doc = new DOMParser().parseFromString(wrapped, 'image/svg+xml');
    } catch (e) {
      console.warn('SVG parse failed', e);
      return false;
    }
    const root = doc.documentElement;
    if (!root || root.querySelector('parsererror')) {
      console.warn('SVG parser error', root && root.textContent);
      return false;
    }

    const foList = root.querySelectorAll('foreignObject');
    const fo = foList[foreignIndex];
    if (!fo) return false;

    // 用 TreeWalker 找出所有非空 text node，第一個替換為新文字、其餘清空
    // 保留原 HTML 結構（font、color、text-align 等樣式）
    const textNodes = [];
    const walker = doc.createTreeWalker(fo, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while ((n = walker.nextNode())) {
      if (n.textContent.replace(/\s+/g, '').length > 0) textNodes.push(n);
    }
    // 處理換行：HTML 的 textContent 會把 \n 當作空白摺疊。
    // 必須將 \n 切分後以 textNode + <br> 元素混合注入，瀏覽器才會渲染為新行。
    const XHTML = 'http://www.w3.org/1999/xhtml';
    const lines = String(newText).split('\n');
    const insertMultilineInto = (parent, anchorTextNode) => {
      // 將 anchorTextNode 替換為「第一行」，後續行以 <br> + textNode 接續
      anchorTextNode.textContent = lines[0];
      let prev = anchorTextNode;
      for (let i = 1; i < lines.length; i++) {
        const br = doc.createElementNS(XHTML, 'br');
        parent.insertBefore(br, prev.nextSibling);
        const t = doc.createTextNode(lines[i]);
        parent.insertBefore(t, br.nextSibling);
        prev = t;
      }
    };
    if (textNodes.length === 0) {
      // 沒有任何文字節點：在 foreignObject 下建立含 br 的內容
      while (fo.firstChild) fo.removeChild(fo.firstChild);
      const div = doc.createElementNS(XHTML, 'div');
      div.setAttribute('xmlns', XHTML);
      div.setAttribute('style', 'text-align:center;');
      div.appendChild(doc.createTextNode(''));
      fo.appendChild(div);
      insertMultilineInto(div, div.firstChild);
    } else {
      insertMultilineInto(textNodes[0].parentNode, textNodes[0]);
      for (let i = 1; i < textNodes.length; i++) textNodes[i].textContent = '';
    }

    // 用 XMLSerializer 序列化，保留大小寫與命名空間；去掉外層 <svg> 包裹
    const serializer = new XMLSerializer();
    let html = '';
    for (const child of Array.from(root.childNodes)) {
      html += serializer.serializeToString(child);
    }
    compound.shapeSvg = html;
    return true;
  }

  // ====== 自動切換右側屬性面板分頁 ======
  function autoSwitchPropTab(obj) {
    if (!obj) return;
    // 文字物件 → 文字 tab；其餘不打擾使用者目前選擇
    if (obj.type === 'text' || (obj.text && obj.text.length > 0 && obj.type === 'shape' && !obj.preserveStyle)) {
      setActivePropTab('text');
    }
  }
  function setActivePropTab(name) {
    $$('.prop-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.prop === name));
    $$('.prop-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
  }

  // ====== 將指定物件平滑捲動至畫布視窗中央 ======
  function centerOnObject(obj) {
    if (!obj) return;
    const stageRect = stage.getBoundingClientRect();
    const hostRect = canvasHost.getBoundingClientRect();
    // 物件中心在 SVG 座標
    const cxSvg = obj.x + obj.w / 2;
    const cySvg = obj.y + obj.h / 2;
    // 對應的畫面像素位置
    const screenX = stageRect.left + cxSvg * state.zoom;
    const screenY = stageRect.top + cySvg * state.zoom;
    // 與 canvasHost 視覺中心的位移
    const dx = screenX - (hostRect.left + hostRect.width / 2);
    const dy = screenY - (hostRect.top + hostRect.height / 2);
    canvasHost.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
    // 物件閃爍效果
    flashObject(obj.id);
  }

  // 物件閃爍提示（透過暫時加上 highlight class）
  function flashObject(id) {
    setTimeout(() => {
      const el = layerRoot.querySelector(`[data-id='${id}']`);
      if (!el) return;
      el.classList.add('flash-highlight');
      setTimeout(() => el.classList.remove('flash-highlight'), 800);
    }, 280);
  }

  // ====== 智慧對齊計算 ======
  function computeSmartSnap(movingIds, dx, dy, threshold) {
    threshold = threshold || 5;
    // 計算移動中物件的合併 bbox（套用 dx, dy 之後）
    const moving = movingIds.map(findObj).filter(Boolean);
    if (moving.length === 0) return { dx, dy, guides: [] };
    let bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;
    moving.forEach((o) => {
      const ox = o.x + dx, oy = o.y + dy;
      bx1 = Math.min(bx1, ox);
      by1 = Math.min(by1, oy);
      bx2 = Math.max(bx2, ox + o.w);
      by2 = Math.max(by2, oy + o.h);
    });
    const mLeft = bx1, mRight = bx2, mCX = (bx1 + bx2) / 2;
    const mTop = by1, mBot = by2, mCY = (by1 + by2) / 2;

    // 候選目標：其他所有物件
    const movingSet = new Set(movingIds);
    const guides = [];
    let snapDX = 0, snapDY = 0;
    let bestDX = threshold + 1, bestDY = threshold + 1;
    state.objects.forEach((o) => {
      if (movingSet.has(o.id)) return;
      const tLeft = o.x, tRight = o.x + o.w, tCX = o.x + o.w / 2;
      const tTop = o.y, tBot = o.y + o.h, tCY = o.y + o.h / 2;
      // 水平對齊（X 方向）
      [
        [mLeft,  tLeft,  tLeft],
        [mLeft,  tRight, tRight],
        [mRight, tLeft,  tLeft],
        [mRight, tRight, tRight],
        [mCX,    tCX,    tCX],
      ].forEach(([m, t, lineX]) => {
        const d = t - m;
        if (Math.abs(d) <= threshold && Math.abs(d) < bestDX) {
          bestDX = Math.abs(d);
          snapDX = d;
        }
        if (Math.abs(d) <= threshold) {
          const yA = Math.min(mTop, tTop) - 12;
          const yB = Math.max(mBot, tBot) + 12;
          guides.push({ x1: lineX, y1: yA, x2: lineX, y2: yB });
        }
      });
      // 垂直對齊（Y 方向）
      [
        [mTop, tTop, tTop],
        [mTop, tBot, tBot],
        [mBot, tTop, tTop],
        [mBot, tBot, tBot],
        [mCY,  tCY,  tCY],
      ].forEach(([m, t, lineY]) => {
        const d = t - m;
        if (Math.abs(d) <= threshold && Math.abs(d) < bestDY) {
          bestDY = Math.abs(d);
          snapDY = d;
        }
        if (Math.abs(d) <= threshold) {
          const xA = Math.min(mLeft, tLeft) - 12;
          const xB = Math.max(mRight, tRight) + 12;
          guides.push({ x1: xA, y1: lineY, x2: xB, y2: lineY });
        }
      });
    });
    return { dx: dx + snapDX, dy: dy + snapDY, guides };
  }

  // ====== Layer & History list ======
  function renderLayers() {
    if (state.objects.length === 0) {
      layerList.innerHTML = '<div class="empty">尚無物件</div>';
      return;
    }
    layerList.innerHTML = '';
    // 由上到下顯示（陣列尾為最上層）
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      const row = document.createElement('div');
      row.className = 'row';
      if (state.selected.has(obj.id)) row.classList.add('selected');
      row.dataset.id = obj.id;
      const visIcon = obj.opacity === 0 ? '◌' : '●';
      const typeBg = obj.ghostFor
        ? 'transparent'
        : (obj.fill === 'transparent' ? 'var(--surface-2)' : obj.fill);
      const typeBorder = obj.ghostFor
        ? 'var(--secondary)'
        : 'var(--border-strong)';
      const namePrefix = obj.ghostFor ? '<span style="color:var(--secondary);font-size:10px;">T</span> ' : '';
      row.innerHTML = `
        <span class="vis" title="顯示/隱藏" data-action="vis">${visIcon}</span>
        <span class="type-ico" style="background:${typeBg};border:1px solid ${typeBorder};"></span>
        <span class="name">${namePrefix}${obj.name}${obj.text ? '：' + obj.text.slice(0, 14) : ''}</span>
        <span class="lock" title="鎖定/解鎖" data-action="lock">${obj.locked ? '🔒' : '🔓'}</span>
      `;
      row.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'lock') {
          obj.locked = !obj.locked;
          renderAll();
          pushHistory('toggle-lock', obj.name);
        } else if (action === 'vis') {
          obj.opacity = obj.opacity === 0 ? 1 : 0;
          renderAll();
          pushHistory('顯示/隱藏', obj.name);
        } else {
          // Shift 多選；否則單選並置中。圖層點擊不擴展群組以利精準選取 ghost 物件
          if (e.shiftKey) {
            if (state.selected.has(obj.id)) state.selected.delete(obj.id);
            else state.selected.add(obj.id);
          } else {
            state.selected = new Set([obj.id]);
          }
          renderAll();
          centerOnObject(obj);
          autoSwitchPropTab(obj);
        }
      });
      layerList.appendChild(row);
    }
  }
  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<div class="empty">尚無紀錄</div>';
      return;
    }
    historyList.innerHTML = '';
    state.history.forEach((h, i) => {
      const row = document.createElement('div');
      row.className = 'row';
      if (i === state.historyIndex) row.classList.add('selected');
      const time = new Date(h.ts).toLocaleTimeString('zh-TW', { hour12: false });
      row.innerHTML = `<span class="name">${time}　${h.action}${h.meta ? ' · ' + h.meta : ''}</span>`;
      row.addEventListener('click', () => {
        state.historyIndex = i;
        state.objects = h.snapshot.map(deepClone);
        state.selected.clear();
        renderAll();
      });
      historyList.appendChild(row);
    });
    historyList.scrollTop = historyList.scrollHeight;
  }

  // ====== Add / Remove / Modify ======
  function addObject(obj, actionLabel) {
    state.objects.push(obj);
    state.selected = new Set([obj.id]);
    renderAll();
    pushHistory(actionLabel || '新增', obj.name);
  }
  function deleteSelected() {
    if (state.selected.size === 0) return;
    state.objects = state.objects.filter((o) => !state.selected.has(o.id));
    state.selected.clear();
    renderAll();
    pushHistory('刪除', '');
  }
  function duplicateSelected() {
    const newIds = new Set();
    Array.from(state.selected).forEach((id) => {
      const src = findObj(id);
      if (!src) return;
      const clone = deepClone(src);
      clone.id = uid(src.type);
      clone.name = clone.id;
      clone.x += 20;
      clone.y += 20;
      state.objects.push(clone);
      newIds.add(clone.id);
    });
    state.selected = newIds;
    renderAll();
    pushHistory('複製', '');
  }
  function modifyObject(id, patch, actionLabel) {
    const o = findObj(id);
    if (!o || o.locked) return;
    Object.assign(o, patch);
    renderAll();
    if (actionLabel) pushHistory(actionLabel, o.name);
  }

  // ====== Coordinate Helpers ======
  function clientToSvg(clientX, clientY) {
    const pt = stage.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = stage.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const r = pt.matrixTransform(inv);
    return { x: r.x, y: r.y };
  }

  // ====== Hit-test & Selection ======
  function hitTest(target) {
    let el = target;
    while (el && el !== stage) {
      if (el.dataset && el.dataset.handle) {
        return { kind: 'handle', dir: el.dataset.handle, id: el.dataset.id };
      }
      if (el.dataset && el.dataset.id) {
        return { kind: 'object', id: el.dataset.id };
      }
      el = el.parentNode;
    }
    return { kind: 'empty' };
  }

  // ====== Pointer Interaction ======
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    const hit = hitTest(e.target);
    const pt = clientToSvg(e.clientX, e.clientY);

    if (state.tool === 'select') {
      if (hit.kind === 'handle') {
        const obj = findObj(hit.id);
        if (!obj || obj.locked) return;
        drag = { mode: hit.dir === 'rotate' ? 'rotate' : 'resize', dir: hit.dir, id: hit.id, startPt: pt, orig: deepClone(obj) };
        // compound shape 縮放時記錄關聯 ghost 的原始狀態
        if (obj.type === 'shape' && (obj.shapeId === 'imported-svg' || obj.shapeId === 'imported')) {
          drag.ghostOrigs = captureGhostsForCompounds([obj.id]);
        }
      } else if (hit.kind === 'object') {
        if (!e.shiftKey && !state.selected.has(hit.id)) state.selected = new Set();
        state.selected.add(hit.id);
        expandSelectionByGroups();
        renderAll();
        autoSwitchPropTab(findObj(hit.id));
        const objs = Array.from(state.selected).map(findObj).filter(Boolean);
        if (objs.some((o) => o.locked)) return;
        drag = { mode: 'move', ids: Array.from(state.selected), startPt: pt, origs: objs.map(deepClone) };
        // compound shape 移動時記錄關聯 ghost 的原始狀態
        const compoundIds = objs
          .filter((o) => o.type === 'shape' && (o.shapeId === 'imported-svg' || o.shapeId === 'imported'))
          .map((o) => o.id);
        if (compoundIds.length > 0) {
          drag.ghostOrigs = captureGhostsForCompounds(compoundIds);
        }
      } else {
        // 空白：開始框選
        if (!e.shiftKey) state.selected.clear();
        renderAll();
        drag = { mode: 'marquee', startPt: pt, currentPt: pt, additive: e.shiftKey, initialSel: new Set(state.selected) };
      }
    } else if (state.tool === 'rect') {
      drag = { mode: 'create', type: 'rect', startPt: pt };
    } else if (state.tool === 'ellipse') {
      drag = { mode: 'create', type: 'ellipse', startPt: pt };
    } else if (state.tool === 'line') {
      drag = { mode: 'create', type: 'line', startPt: pt };
    } else if (state.tool === 'text') {
      const obj = createObject('text', { x: pt.x, y: pt.y - 12, w: 160, h: 28, text: '雙擊以編輯文字', fill: 'transparent', stroke: 'transparent' });
      obj.name = uid('text');
      addObject(obj, '新增文字');
      setTool('select');
    }
  });

  stage.addEventListener('pointermove', (e) => {
    const pt = clientToSvg(e.clientX, e.clientY);
    statusCoord.textContent = `X: ${pt.x.toFixed(0)}, Y: ${pt.y.toFixed(0)}`;
    if (!drag) return;

    if (drag.mode === 'move') {
      let dx = pt.x - drag.startPt.x;
      let dy = pt.y - drag.startPt.y;
      // 智慧對齊（按 Alt 暫停）
      if (!e.altKey) {
        const snapResult = computeSmartSnap(drag.ids, dx, dy, 6);
        dx = snapResult.dx;
        dy = snapResult.dy;
        state.smartGuides = snapResult.guides;
      } else {
        state.smartGuides = [];
      }
      if (state.snapToGrid) {
        dx = snap(dx);
        dy = snap(dy);
      }
      drag.ids.forEach((id, i) => {
        const o = findObj(id);
        if (!o || o.locked) return;
        o.x = drag.origs[i].x + dx;
        o.y = drag.origs[i].y + dy;
      });
      // compound 移動時讓 ghost 同步位移
      if (drag.ghostOrigs && drag.ghostOrigs.length > 0) {
        applyGhostTranslate(drag.ghostOrigs, dx, dy);
      }
      renderAll();
    } else if (drag.mode === 'resize') {
      const o = findObj(drag.id);
      if (!o) return;
      const orig = drag.orig;
      const dx = pt.x - drag.startPt.x;
      const dy = pt.y - drag.startPt.y;
      let nx = orig.x, ny = orig.y, nw = orig.w, nh = orig.h;
      if (drag.dir.includes('e')) nw = Math.max(8, orig.w + dx);
      if (drag.dir.includes('s')) nh = Math.max(8, orig.h + dy);
      if (drag.dir.includes('w')) { nw = Math.max(8, orig.w - dx); nx = orig.x + (orig.w - nw); }
      if (drag.dir.includes('n')) { nh = Math.max(8, orig.h - dy); ny = orig.y + (orig.h - nh); }
      // Shift 鍵或 ratio-lock 勾選 → 維持長寬比
      const ratioLock = $('#ratio-lock').checked || e.shiftKey;
      if (ratioLock && drag.dir.length === 2) {
        const ratio = orig.w / orig.h;
        if (nw / nh > ratio) nw = nh * ratio; else nh = nw / ratio;
        if (drag.dir.includes('w')) nx = orig.x + (orig.w - nw);
        if (drag.dir.includes('n')) ny = orig.y + (orig.h - nh);
      }
      o.x = nx; o.y = ny; o.w = nw; o.h = nh;
      // compound 縮放時 ghost 同步等比變形
      if (drag.ghostOrigs && drag.ghostOrigs.length > 0) {
        applyGhostScale(drag.ghostOrigs, drag.orig, o);
      }
      renderAll();
    } else if (drag.mode === 'rotate') {
      const o = findObj(drag.id);
      if (!o) return;
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      const angle = Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI + 90;
      o.rotation = Math.round(angle);
      renderAll();
    } else if (drag.mode === 'create') {
      const x = Math.min(drag.startPt.x, pt.x);
      const y = Math.min(drag.startPt.y, pt.y);
      const w = Math.abs(pt.x - drag.startPt.x);
      const h = Math.abs(pt.y - drag.startPt.y);
      overlay.innerHTML = '';
      const preview = document.createElementNS(SVG_NS, 'rect');
      preview.setAttribute('class', 'selection-rect');
      preview.setAttribute('x', x); preview.setAttribute('y', y);
      preview.setAttribute('width', w); preview.setAttribute('height', h);
      overlay.appendChild(preview);
    } else if (drag.mode === 'marquee') {
      drag.currentPt = pt;
      const x = Math.min(drag.startPt.x, pt.x);
      const y = Math.min(drag.startPt.y, pt.y);
      const w = Math.abs(pt.x - drag.startPt.x);
      const h = Math.abs(pt.y - drag.startPt.y);
      // 計算覆蓋的物件
      const hits = state.objects.filter((o) => {
        return o.x + o.w >= x && o.x <= x + w && o.y + o.h >= y && o.y <= y + h;
      });
      const ids = new Set(drag.additive ? drag.initialSel : []);
      hits.forEach((o) => ids.add(o.id));
      state.selected = ids;
      // 擴展同群組
      expandSelectionByGroups();
      // 重繪 overlay + marquee
      renderOverlay();
      const marquee = document.createElementNS(SVG_NS, 'rect');
      marquee.setAttribute('class', 'marquee-rect');
      marquee.setAttribute('x', x); marquee.setAttribute('y', y);
      marquee.setAttribute('width', w); marquee.setAttribute('height', h);
      overlay.appendChild(marquee);
    }
  });

  stage.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    if (drag.mode === 'create') {
      const x = Math.min(drag.startPt.x, pt.x);
      const y = Math.min(drag.startPt.y, pt.y);
      const w = Math.max(20, Math.abs(pt.x - drag.startPt.x));
      const h = Math.max(20, Math.abs(pt.y - drag.startPt.y));
      const obj = createObject(drag.type, { x, y, w, h });
      obj.name = uid(drag.type);
      addObject(obj, '新增 ' + drag.type);
      setTool('select');
    } else if (drag.mode === 'move' || drag.mode === 'resize' || drag.mode === 'rotate') {
      pushHistory(drag.mode === 'move' ? '移動' : drag.mode === 'resize' ? '縮放' : '旋轉', '');
    } else if (drag.mode === 'marquee') {
      if (state.selected.size > 0) {
        statusSel.textContent = `已選取 ${state.selected.size} 個物件`;
      }
    }
    drag = null;
    state.smartGuides = [];
    renderAll();
  });

  // 雙擊物件 → 內嵌文字編輯
  stage.addEventListener('dblclick', (e) => {
    if (state.tool === 'hand') return;
    const hit = hitTest(e.target);
    if (hit.kind !== 'object') return;
    const obj = findObj(hit.id);
    if (!obj || obj.locked) return;
    e.preventDefault();
    openInlineTextEditor(obj);
  });

  function openInlineTextEditor(obj) {
    // 計算螢幕座標：fixed 定位以 viewport 為基準，getScreenCTM 已含縮放
    const ctm = stage.getScreenCTM();
    if (!ctm) return;
    const tl = stage.createSVGPoint(); tl.x = obj.x; tl.y = obj.y;
    const br = stage.createSVGPoint(); br.x = obj.x + obj.w; br.y = obj.y + obj.h;
    const a = tl.matrixTransform(ctm);
    const b = br.matrixTransform(ctm);
    const scaledFontSize = Math.max(10, obj.fontSize * state.zoom);
    const useFO = !!obj.useForeignObject; // 與 buildTextNode 一致的對齊邏輯
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.spellcheck = false;
    editor.className = 'inline-text-editor';
    editor.style.cssText = `
      position: fixed;
      left: ${a.x}px;
      top: ${a.y}px;
      width: ${Math.max(80, b.x - a.x)}px;
      min-height: ${Math.max(24, b.y - a.y)}px;
      padding: 4px 6px;
      font-family: ${obj.fontFamily};
      font-size: ${scaledFontSize}px;
      font-weight: ${obj.fontWeight};
      font-style: ${obj.fontStyle};
      color: ${obj.textColor};
      text-align: ${obj.textAlign};
      background: var(--surface);
      border: 1.5px solid var(--primary);
      border-radius: 4px;
      box-shadow: var(--shadow-md);
      outline: none;
      z-index: 90;
      line-height: 1.25;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    editor.textContent = obj.text || '';
    document.body.appendChild(editor);

    // 延遲 focus + 全選，避免被當前的 pointerup 搶走焦點
    setTimeout(() => {
      editor.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(editor);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) {}
    }, 0);

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const next = editor.innerText.replace(/ /g, ' ');
      if (editor.parentNode) editor.parentNode.removeChild(editor);
      if (next !== obj.text) {
        // Ghost 物件：先寫 compound 再更新自身、單次渲染
        if (obj.ghostFor) {
          obj.text = next;
          if (obj.opacity === 0) obj.opacity = 1;
          updateCompoundForeignText(obj.ghostFor.compoundId, obj.ghostFor.foreignIndex, next);
          renderAll();
          pushHistory('編輯文字', obj.name);
        } else {
          const patch = { text: next };
          if (obj.opacity === 0) patch.opacity = 1;
          modifyObject(obj.id, patch, '編輯文字');
        }
      }
    };
    const cancel = () => {
      if (committed) return;
      committed = true;
      if (editor.parentNode) editor.parentNode.removeChild(editor);
    };
    editor.addEventListener('blur', commit);
    editor.addEventListener('keydown', (ev) => {
      ev.stopPropagation(); // 阻擋畫布的全域快捷鍵
      if (ev.key === 'Escape') { ev.preventDefault(); cancel(); return; }
      // 單獨 Enter 確認；Shift+Enter 或 IME 組字中允許換行
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        editor.blur();
      }
    });
    editor.addEventListener('keyup', (ev) => ev.stopPropagation());
  }

  // ====== Wheel zoom（Ctrl+滾輪 = 縮放；單獨滾輪 = 上下捲動，Shift+滾輪 = 左右捲動）======
  canvasHost.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      setZoom(state.zoom * factor);
    } else if (e.shiftKey && e.deltaX === 0) {
      // Shift+滾輪 → 水平捲動
      e.preventDefault();
      canvasHost.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Space + 拖曳 → 平移畫布
  let spaceDown = false;
  let panState = null;
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spaceDown) {
      const tgt = e.target;
      if (tgt.matches && tgt.matches('input, textarea, [contenteditable]')) return;
      e.preventDefault();
      spaceDown = true;
      canvasHost.classList.add('panning');
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spaceDown = false;
      canvasHost.classList.remove('panning', 'active');
    }
  });
  canvasHost.addEventListener('pointerdown', (e) => {
    if (spaceDown || e.button === 1 || state.tool === 'hand') {
      e.preventDefault();
      canvasHost.classList.add('active');
      panState = { x: e.clientX, y: e.clientY, sl: canvasHost.scrollLeft, st: canvasHost.scrollTop };
      canvasHost.setPointerCapture(e.pointerId);
    }
  });
  canvasHost.addEventListener('pointermove', (e) => {
    if (!panState) return;
    canvasHost.scrollLeft = panState.sl - (e.clientX - panState.x);
    canvasHost.scrollTop = panState.st - (e.clientY - panState.y);
  });
  canvasHost.addEventListener('pointerup', () => {
    if (panState) { canvasHost.classList.remove('active'); panState = null; }
  });

  function setZoom(z) {
    state.zoom = clamp(z, ZOOM_MIN, ZOOM_MAX);
    stage.style.width = (1200 * state.zoom) + 'px';
    stage.style.height = (800 * state.zoom) + 'px';
    $('#zoom-value').textContent = Math.round(state.zoom * 100) + '%';
  }

  // ====== Tool Selection ======
  function setTool(t) {
    state.tool = t;
    $$('.tool[data-tool]').forEach((b) => b.setAttribute('data-active', b.dataset.tool === t ? 'true' : 'false'));
    // 手型工具下：游標切為手掌、SVG 設為 pointer-events: none 以避免誤觸物件
    if (t === 'hand') {
      canvasHost.classList.add('panning');
      stage.style.pointerEvents = 'none';
    } else {
      canvasHost.classList.remove('panning', 'active');
      stage.style.pointerEvents = '';
    }
    statusInfo.textContent = '工具：' + ({ select: '選擇', hand: '手型（拖曳畫布）', text: '文字', rect: '矩形', ellipse: '橢圓', line: '直線' }[t] || t);
  }
  $$('.tool[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

  $('#btn-zoom-in').onclick = () => setZoom(state.zoom * ZOOM_STEP);
  $('#btn-zoom-out').onclick = () => setZoom(state.zoom / ZOOM_STEP);
  $('#btn-zoom-100').onclick = () => setZoom(1);
  $('#btn-zoom-fit').onclick = () => {
    const w = canvasHost.clientWidth - 48;
    const h = canvasHost.clientHeight - 48;
    setZoom(Math.min(w / 1200, h / 800));
  };

  // ====== Tabs ======
  $$('.panel-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const group = tab.parentElement;
      group.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.dataset.prop;
      if (pane) {
        $$('.prop-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === pane));
      }
    });
  });
  // 底部圖層 / 歷史紀錄分頁
  $$('.bot-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.bot-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.dataset.bottab;
      $$('.bot-pane').forEach((p) => p.classList.toggle('active', p.dataset.botpane === pane));
      $('#panel-bottom').classList.remove('collapsed'); // 點分頁自動展開
    });
  });
  $('#bot-toggle').onclick = () => {
    $('#panel-bottom').classList.toggle('collapsed');
  };

  // ====== Panel collapse (mobile) ======
  $('#btn-collapse-left').onclick = () => $('#panel-left').classList.remove('open');
  $('#btn-collapse-right').onclick = () => $('#panel-right').classList.remove('open');

  // ====== 形狀庫渲染 ======
  function renderShapeLibrary(filter) {
    const host = $('#shape-categories');
    host.innerHTML = '';
    const f = (filter || '').trim().toLowerCase();
    window.__SHAPES__.forEach((cat, idx) => {
      const items = cat.items.filter((it) => !f || it.name.toLowerCase().includes(f) || it.id.toLowerCase().includes(f));
      if (items.length === 0) return;
      const d = document.createElement('details');
      d.className = 'shape-group';
      // 預設只展開「一般」分類；搜尋時所有命中分類都展開
      if (idx === 0 || f) d.open = true;
      d.innerHTML = `<summary>${cat.cat}</summary><div class="shape-grid"></div>`;
      const grid = d.querySelector('.shape-grid');
      items.forEach((shape) => {
        const cell = document.createElement('div');
        cell.className = 'shape-item';
        cell.title = shape.name;
        cell.dataset.shapeId = shape.id;
        cell.draggable = true;
        cell.innerHTML = `<svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">${shape.svg}</svg>`;
        cell.addEventListener('click', () => addShapeAt(shape, 400, 300));
        cell.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/x-shape', JSON.stringify({ id: shape.id }));
        });
        grid.appendChild(cell);
      });
      host.appendChild(d);
    });
  }
  function addShapeAt(shape, x, y) {
    const obj = createObject('shape', { x, y, w: 160, h: 96, shapeId: shape.id, shapeSvg: shape.svg });
    obj.name = uid(shape.id);
    if (shape.id.startsWith('flow-') || shape.id === 'text-only') obj.text = '';
    addObject(obj, '新增 ' + shape.name);
  }

  $('#shape-search').addEventListener('input', (e) => renderShapeLibrary(e.target.value));

  // 形狀拖曳至畫布
  stage.addEventListener('dragover', (e) => { e.preventDefault(); });
  stage.addEventListener('drop', (e) => {
    const raw = e.dataTransfer.getData('text/x-shape');
    if (!raw) return;
    e.preventDefault();
    const data = JSON.parse(raw);
    const found = window.__SHAPES__.flatMap((c) => c.items).find((s) => s.id === data.id);
    if (!found) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    addShapeAt(found, pt.x - 80, pt.y - 48);
  });

  // ====== Preset 色卡 ======
  function renderPresets() {
    const grid = $('#preset-grid');
    grid.innerHTML = '';
    window.__PRESETS__.forEach((p, i) => {
      const c = document.createElement('div');
      c.className = 'preset-cell';
      c.style.background = p.fill;
      c.style.borderColor = p.stroke;
      c.title = `填滿 ${p.fill}`;
      c.addEventListener('click', () => {
        if (state.selected.size === 0) return;
        state.selected.forEach((id) => modifyObject(id, { fill: p.fill, stroke: p.stroke }));
        pushHistory('套用樣式預設', `#${i + 1}`);
      });
      grid.appendChild(c);
    });
  }

  // ====== 屬性面板綁定 ======
  function syncPropertyPanel() {
    const first = state.selected.size > 0 ? findObj(Array.from(state.selected)[0]) : null;
    if (!first) {
      statusSel.textContent = '未選取物件';
      if (textContentInput) {
        textContentInput.value = '';
        textContentInput.disabled = true;
      }
      if (textContentHint) {
        textContentHint.textContent = '請先在畫布或圖層面板中選取物件。';
        textContentHint.classList.remove('warn');
      }
      return;
    }
    statusSel.textContent = `已選取：${first.name}（${first.type}）`;

    // 文字內容輸入區同步
    if (textContentInput) {
      // 避免使用者正在輸入時被覆蓋
      if (document.activeElement !== textContentInput) {
        textContentInput.value = first.text || '';
      }
      textContentInput.disabled = false;
    }
    if (textContentHint) {
      if (first.type === 'text' || first.text !== undefined) {
        textContentHint.textContent = `編輯中：${first.name}（按 Tab 離開即套用）`;
        textContentHint.classList.remove('warn');
      } else {
        textContentHint.textContent = '此物件目前無文字屬性，輸入內容會以文字標籤覆蓋於物件上。';
        textContentHint.classList.add('warn');
      }
    }

    // 物件樣式
    $('#fill-enable').checked = first.fillEnabled;
    if (first.fill && first.fill !== 'transparent') $('#fill-color').value = first.fill;
    $('#stroke-enable').checked = first.strokeEnabled;
    if (first.stroke && first.stroke !== 'transparent') $('#stroke-color').value = first.stroke;
    $('#stroke-width').value = first.strokeWidth;
    $('#stroke-style').value = first.strokeStyle;
    $('#opacity').value = Math.round(first.opacity * 100);
    $('#effect-sketch').checked = !!first.sketch;
    $('#effect-shadow').checked = !!first.shadow;

    // 文字
    $('#font-family').value = first.fontFamily;
    $('#text-size').value = first.fontSize;
    $('#text-fill').value = first.textColor;
    $('#text-opacity').value = Math.round(first.opacity * 100);
    $$('.btn-bar [data-align]').forEach((b) => b.classList.toggle('active', b.dataset.align === first.textAlign));
    $$('.btn-bar [data-valign]').forEach((b) => b.classList.toggle('active', b.dataset.valign === first.textVAlign));
    $('#text-bold').classList.toggle('active', first.fontWeight === 'bold');
    $('#text-italic').classList.toggle('active', first.fontStyle === 'italic');
    $('#text-underline').classList.toggle('active', first.textDecoration === 'underline');

    // 調整
    $('#size-w').value = Math.round(first.w);
    $('#size-h').value = Math.round(first.h);
    $('#pos-x').value = Math.round(first.x);
    $('#pos-y').value = Math.round(first.y);
    $('#rotate').value = Math.round(first.rotation);
  }

  function bindControl(sel, key, parser) {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      if (state.selected.size === 0) return;
      const v = parser ? parser(el) : el.value;
      Array.from(state.selected).forEach((id) => modifyObject(id, { [key]: v }));
    });
    el.addEventListener('change', () => {
      if (state.selected.size === 0) return;
      pushHistory('修改屬性', key);
    });
  }

  // 文字內容區即時綁定（input：即時渲染；change：寫入歷史紀錄）
  if (textContentInput) {
    let lastCommitted = '';
    textContentInput.addEventListener('focus', () => {
      lastCommitted = textContentInput.value;
    });
    // 即時更新 ghost.text 與其他屬性，但 compound shapeSvg 重序列化採 debounce
    // 避免大型 SVG（80KB+）在每個按鍵都全量重解析造成輸入卡頓
    let textInputDebounce = null;
    textContentInput.addEventListener('input', () => {
      if (state.selected.size === 0) return;
      const v = textContentInput.value;
      const ghostsToSync = [];
      state.selected.forEach((id) => {
        const o = findObj(id);
        if (!o || o.locked) return;
        o.text = v;
        if (o.opacity === 0) o.opacity = 1;
        if (o.ghostFor) ghostsToSync.push(o.ghostFor);
      });
      renderAll(); // 先即時更新 layer list、textarea hint 等 UI
      if (ghostsToSync.length > 0) {
        clearTimeout(textInputDebounce);
        textInputDebounce = setTimeout(() => {
          ghostsToSync.forEach((ref) => updateCompoundForeignText(ref.compoundId, ref.foreignIndex, v));
          renderAll();
        }, 80);
      }
    });
    textContentInput.addEventListener('change', () => {
      if (textContentInput.value !== lastCommitted) {
        pushHistory('編輯文字', '');
        lastCommitted = textContentInput.value;
      }
    });
    // Tab 鍵離開、Esc 取消
    textContentInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { textContentInput.blur(); }
    });
    textContentInput.addEventListener('keyup', (e) => e.stopPropagation());
  }

  bindControl('#fill-color', 'fill');
  bindControl('#stroke-color', 'stroke');
  bindControl('#stroke-width', 'strokeWidth', (el) => parseFloat(el.value) || 0);
  bindControl('#stroke-style', 'strokeStyle');
  bindControl('#opacity', 'opacity', (el) => clamp(parseFloat(el.value) / 100, 0, 1));
  bindControl('#text-opacity', 'opacity', (el) => clamp(parseFloat(el.value) / 100, 0, 1));
  bindControl('#font-family', 'fontFamily');
  bindControl('#text-size', 'fontSize', (el) => parseFloat(el.value) || 12);
  bindControl('#text-fill', 'textColor');
  bindControl('#size-w', 'w', (el) => Math.max(8, parseFloat(el.value) || 0));
  bindControl('#size-h', 'h', (el) => Math.max(8, parseFloat(el.value) || 0));
  bindControl('#pos-x', 'x', (el) => parseFloat(el.value) || 0);
  bindControl('#pos-y', 'y', (el) => parseFloat(el.value) || 0);
  bindControl('#rotate', 'rotation', (el) => parseFloat(el.value) || 0);

  $('#fill-enable').addEventListener('change', (e) => {
    state.selected.forEach((id) => modifyObject(id, { fillEnabled: e.target.checked }));
    pushHistory('切換填滿', '');
  });
  $('#stroke-enable').addEventListener('change', (e) => {
    state.selected.forEach((id) => modifyObject(id, { strokeEnabled: e.target.checked }));
    pushHistory('切換邊線', '');
  });
  $('#effect-shadow').addEventListener('change', (e) => {
    state.selected.forEach((id) => modifyObject(id, { shadow: e.target.checked }));
    pushHistory('切換陰影', '');
  });
  $('#effect-sketch').addEventListener('change', (e) => {
    state.selected.forEach((id) => modifyObject(id, { sketch: e.target.checked }));
  });

  // 文字樣式按鈕
  $('#text-bold').onclick = () => state.selected.forEach((id) => {
    const o = findObj(id);
    modifyObject(id, { fontWeight: o.fontWeight === 'bold' ? 'normal' : 'bold' }, '切換粗體');
  });
  $('#text-italic').onclick = () => state.selected.forEach((id) => {
    const o = findObj(id);
    modifyObject(id, { fontStyle: o.fontStyle === 'italic' ? 'normal' : 'italic' }, '切換斜體');
  });
  $('#text-underline').onclick = () => state.selected.forEach((id) => {
    const o = findObj(id);
    modifyObject(id, { textDecoration: o.textDecoration === 'underline' ? 'none' : 'underline' }, '切換底線');
  });
  $('#text-strike').onclick = () => state.selected.forEach((id) => {
    const o = findObj(id);
    modifyObject(id, { textDecoration: o.textDecoration === 'line-through' ? 'none' : 'line-through' }, '切換刪除線');
  });

  $$('.btn-bar [data-align]').forEach((b) => b.addEventListener('click', () => {
    state.selected.forEach((id) => modifyObject(id, { textAlign: b.dataset.align }, '水平對齊'));
    syncPropertyPanel();
  }));
  $$('.btn-bar [data-valign]').forEach((b) => b.addEventListener('click', () => {
    state.selected.forEach((id) => modifyObject(id, { textVAlign: b.dataset.valign }, '垂直對齊'));
    syncPropertyPanel();
  }));

  // 調整面板按鈕
  $('#layer-top').onclick = () => moveLayer('top');
  $('#layer-bottom').onclick = () => moveLayer('bottom');
  $('#layer-up').onclick = () => moveLayer('up');
  $('#layer-down').onclick = () => moveLayer('down');
  function moveLayer(action) {
    if (state.selected.size === 0) return;
    const sel = new Set(state.selected);
    const selObjs = state.objects.filter((o) => sel.has(o.id));
    const others = state.objects.filter((o) => !sel.has(o.id));
    if (action === 'top') state.objects = [...others, ...selObjs];
    else if (action === 'bottom') state.objects = [...selObjs, ...others];
    else if (action === 'up' || action === 'down') {
      const arr = state.objects.slice();
      for (let i = action === 'up' ? arr.length - 1 : 0;
           action === 'up' ? i >= 0 : i < arr.length;
           action === 'up' ? i-- : i++) {
        if (!sel.has(arr[i].id)) continue;
        const j = action === 'up' ? i + 1 : i - 1;
        if (j < 0 || j >= arr.length || sel.has(arr[j].id)) continue;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      state.objects = arr;
    }
    renderAll();
    pushHistory('調整圖層', action);
  }

  $('#flip-h').onclick = () => {
    state.selected.forEach((id) => {
      const o = findObj(id);
      modifyObject(id, { flipH: !o.flipH }, '水平翻轉');
    });
  };
  $('#flip-v').onclick = () => {
    state.selected.forEach((id) => {
      const o = findObj(id);
      modifyObject(id, { flipV: !o.flipV }, '垂直翻轉');
    });
  };
  $('#btn-rotate-90').onclick = () => {
    state.selected.forEach((id) => {
      const o = findObj(id);
      modifyObject(id, { rotation: (o.rotation + 90) % 360 }, '旋轉 90°');
    });
  };
  $('#snap-grid').onclick = () => {
    state.snapToGrid = !state.snapToGrid;
    $('#snap-grid').classList.toggle('active', state.snapToGrid);
    canvasHost.parentElement.classList.toggle('show-grid', state.snapToGrid);
    statusInfo.textContent = '網格對齊：' + (state.snapToGrid ? '開啟' : '關閉');
  };
  $('#btn-duplicate').onclick = duplicateSelected;
  $('#btn-lock').onclick = () => {
    state.selected.forEach((id) => {
      const o = findObj(id);
      modifyObject(id, { locked: !o.locked }, '鎖定/解鎖');
    });
  };
  $('#btn-group').onclick = () => doGroup();
  function doGroup() {
    if (state.selected.size < 2) {
      statusInfo.textContent = '請至少選取 2 個物件再建立群組';
      return;
    }
    state.groupCounter += 1;
    const gid = 'g-' + String(state.groupCounter).padStart(2, '0');
    state.selected.forEach((id) => {
      const o = findObj(id);
      if (o) o.groupId = gid;
    });
    renderAll();
    pushHistory('建立群組', `${gid}（${state.selected.size} 物件）`);
    statusInfo.textContent = `已建立群組 ${gid}`;
  }
  function doUngroup() {
    const removedGroups = new Set();
    let count = 0;
    state.selected.forEach((id) => {
      const o = findObj(id);
      if (o && o.groupId) {
        removedGroups.add(o.groupId);
      }
    });
    if (removedGroups.size === 0) {
      statusInfo.textContent = '選取的物件不在群組中';
      return;
    }
    state.objects.forEach((o) => {
      if (o.groupId && removedGroups.has(o.groupId)) {
        o.groupId = null;
        count += 1;
      }
    });
    renderAll();
    pushHistory('解散群組', `${count} 個物件`);
    statusInfo.textContent = `已解散 ${removedGroups.size} 個群組`;
  }
  $('#btn-explore').onclick = () => {
    statusInfo.textContent = '已切換至 Explore 模式（瀏覽）';
  };

  // 對齊文字至圖形：每個 text 物件對齊到包含它中心的最小形狀，
  // 自動縮小字級確保完整顯示
  $('#btn-fit-texts').onclick = () => doFitTextsToShapes();

  // 實際測量 HTML 文字渲染高度（鏡像 buildTextNode 的 foreignObject 樣式）
  // 用隱藏 div 暫時加入 DOM 取得 offsetHeight，再移除
  function measureForeignTextHeight(text, fontFamily, fontSize, width) {
    const div = document.createElement('div');
    div.style.cssText = [
      'position:fixed', 'left:-9999px', 'top:0', 'visibility:hidden',
      `width:${width}px`,
      `font-family:${fontFamily}`,
      `font-size:${fontSize}px`,
      'line-height:1.2',
      'padding:1px 2px',
      'white-space:pre-wrap',
      'word-break:break-all',
      'overflow-wrap:anywhere',
      'box-sizing:border-box',
    ].join(';');
    div.textContent = String(text || '');
    document.body.appendChild(div);
    const h = div.offsetHeight;
    document.body.removeChild(div);
    return h;
  }

  // 二分搜尋：找出能讓文字完整裝進 (width × maxHeight) 的最大字級（上限為 currentFontSize）
  function findFittingFontSize(text, fontFamily, currentFontSize, width, maxHeight) {
    // 先以目前字級測量；若已裝得下，直接回傳（不放大）
    const h0 = measureForeignTextHeight(text, fontFamily, currentFontSize, width);
    if (h0 <= maxHeight) return currentFontSize;
    // 太高 → 二分搜尋向下
    let lo = 3, hi = currentFontSize;
    for (let i = 0; i < 14; i++) {
      if (hi - lo < 0.25) break;
      const mid = (lo + hi) / 2;
      const h = measureForeignTextHeight(text, fontFamily, mid, width);
      if (h <= maxHeight) lo = mid; else hi = mid;
    }
    return Math.max(3, Math.floor(lo * 10) / 10);
  }

  function doFitTextsToShapes() {
    let targets;
    if (state.selected.size > 0) {
      targets = Array.from(state.selected).map(findObj).filter((o) => o && o.type === 'text');
    } else {
      targets = state.objects.filter((o) => o.type === 'text');
    }
    if (targets.length === 0) {
      statusInfo.textContent = '沒有可對齊的文字物件';
      return;
    }
    const shapes = state.objects.filter((o) => o.type !== 'text' && o.type !== 'image' && !o.ghostFor);
    let fitted = 0;
    let shrunk = 0;
    targets.forEach((t) => {
      const cx = t.x + t.w / 2;
      const cy = t.y + t.h / 2;
      const containers = shapes.filter((s) => cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h);
      if (containers.length === 0) return;
      containers.sort((a, b) => (a.w * a.h) - (b.w * b.h));
      const c = containers[0];

      // 2% padding：保留少許邊距，避免文字緊貼邊框
      const pad = Math.max(2, Math.min(c.w, c.h) * 0.02);
      const interiorW = Math.max(20, c.w - pad * 2);
      const interiorH = Math.max(16, c.h - pad * 2);

      // 自動縮小字級至能完整裝進 bbox
      const fontFamily = t.fontFamily || 'Tahoma, sans-serif';
      const newFont = findFittingFontSize(String(t.text || ''), fontFamily, t.fontSize, interiorW, interiorH);
      if (newFont < t.fontSize) shrunk += 1;

      t.fontSize = newFont;
      t.x = c.x + pad;
      t.y = c.y + pad;
      t.w = interiorW;
      t.h = interiorH;
      t.useForeignObject = true;
      t.textAlign = 'center';
      t.textVAlign = 'middle';
      fitted += 1;
    });
    renderAll();
    pushHistory('對齊文字至圖形', `${fitted} 個文字`);
    statusInfo.textContent = `已對齊 ${fitted} 個文字（其中 ${shrunk} 個自動縮小字級以完整顯示）`;
  }

  // 拆解匯入：把選取的 compound shape 展開為個別可編輯物件
  $('#btn-decompose').onclick = () => doDecompose();
  function doDecompose() {
    const selectedObjs = Array.from(state.selected).map(findObj).filter(Boolean);
    const targets = selectedObjs.filter((o) => o.type === 'shape' && (o.shapeId === 'imported-svg' || o.shapeId === 'imported'));

    // 若選取的是 ghost，自動找到其所屬 compound
    if (targets.length === 0) {
      const compoundIdsFromGhosts = new Set();
      selectedObjs.forEach((o) => {
        if (o.ghostFor && o.ghostFor.compoundId) compoundIdsFromGhosts.add(o.ghostFor.compoundId);
      });
      compoundIdsFromGhosts.forEach((cid) => {
        const compound = findObj(cid);
        if (compound) targets.push(compound);
      });
    }

    // 仍沒有目標 → 詢問是否拆解全部
    if (targets.length === 0) {
      if (!confirm('未選取匯入的 compound shape。\n要嘗試拆解畫布上所有的匯入物件嗎？')) return;
      state.objects.forEach((o) => {
        if (o.type === 'shape' && (o.shapeId === 'imported-svg' || o.shapeId === 'imported')) {
          targets.push(o);
        }
      });
      if (targets.length === 0) {
        statusInfo.textContent = '畫布上沒有可拆解的匯入物件';
        return;
      }
    }
    if (!confirm(`即將拆解 ${targets.length} 個匯入物件為個別形狀與文字。\n拆解後將失去原始 foreignObject 的 HTML 排版細節（但仍可編輯）。\n確定繼續？`)) return;

    let totalNew = 0;
    targets.forEach((compound) => {
      const newObjs = decomposeCompound(compound);
      totalNew += newObjs.length;
    });
    state.selected.clear();
    renderAll();
    pushHistory('拆解匯入', `${targets.length} 張 → ${totalNew} 個物件`);
    statusInfo.textContent = `已拆解 ${targets.length} 張匯入為 ${totalNew} 個個別物件（不滿意可按 Ctrl+Z 還原；亦可使用「對齊文字至圖形」按鈕修正排版）`;
  }

  function decomposeCompound(compound) {
    const vb = compound.shapeViewBox || { x: 0, y: 0, w: 100, h: 60 };
    const sx = compound.w / vb.w;
    const sy = compound.h / vb.h;
    const ox = compound.x;
    const oy = compound.y;

    // 解析 compound.shapeSvg（SVG 命名空間）
    const wrapped = `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink">${compound.shapeSvg}</svg>`;
    const doc = new DOMParser().parseFromString(wrapped, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root) return [];

    const newObjs = [];
    // 一、處理形狀元素
    root.querySelectorAll('rect, circle, ellipse, line, polygon, polyline, path').forEach((el) => {
      const obj = decomposeElementToObject(el, ox, oy, sx, sy, vb);
      if (obj) {
        obj.name = uid(obj.type);
        newObjs.push(obj);
      }
    });
    // 二、處理 foreignObject 文字（替代原 ghost）
    root.querySelectorAll('foreignObject').forEach((fo) => {
      const text = (fo.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      let tx = 0, ty = 0;
      let parent = fo.parentNode;
      while (parent && parent !== root) {
        const t = parent.getAttribute && parent.getAttribute('transform');
        if (t) {
          const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(t);
          if (m) { tx += parseFloat(m[1]); ty += parseFloat(m[2]); break; }
        }
        parent = parent.parentNode;
      }
      const wf = parseFloat(fo.getAttribute('width')) || 80;
      const hf = parseFloat(fo.getAttribute('height')) || 20;
      let fontFamily = 'Tahoma, sans-serif';
      let fontSize = 12;
      let textColor = '#1F2937';
      const inner = fo.querySelector('div, span, p');
      if (inner) {
        const style = inner.getAttribute('style') || '';
        const ff = /font-family:\s*([^;"]+)/i.exec(style);
        const fs = /font-size:\s*([\d.]+)px/i.exec(style);
        const co = /color:\s*(rgb\([^)]+\)|#[0-9a-f]{3,8})/i.exec(style);
        if (ff) fontFamily = ff[1].trim() + ', sans-serif';
        if (fs) fontSize = parseFloat(fs[1]);
        if (co) textColor = co[1];
      }
      // 拆解的文字使用 foreignObject 渲染 → 保留 HTML word-wrap，
      // 避免長中文句溢出 bbox（同 v0.0.7 修正策略，但因已脫離 ghost
      // 不再有「相鄰 ghost 互相重疊」問題）
      const obj = createObject('text', {
        x: (tx - vb.x) * sx + ox,
        y: (ty - vb.y) * sy + oy,
        w: Math.max(20, wf * sx),
        h: Math.max(16, hf * sy),
        text,
        useForeignObject: true,
      });
      obj.fontFamily = fontFamily;
      obj.fontSize = Math.max(3, fontSize * Math.min(sx, sy));
      obj.textColor = textColor;
      obj.fillEnabled = false;
      obj.strokeEnabled = false;
      obj.textAlign = 'center';
      obj.textVAlign = 'middle';
      obj.name = uid('text');
      newObjs.push(obj);
    });

    // 二之二、處理原生 SVG <text> 元素
    //    draw.io 對某些粗體 / 大字級標題會用 <text> 而非 foreignObject
    //    必須單獨處理，否則拆解後這些文字會完全消失
    root.querySelectorAll('text').forEach((el) => {
      // 跳過 foreignObject 內部的 text（已由上方處理）
      if (el.closest && el.closest('foreignObject')) return;
      const text = (el.textContent || '').trim();
      if (!text) return;

      // 收集位置與樣式（包含父層 g 的繼承）
      let x = parseFloat(el.getAttribute('x')) || 0;
      let y = parseFloat(el.getAttribute('y')) || 0;
      let fontFamily = el.getAttribute('font-family') || '';
      let fontSize = parseFloat(el.getAttribute('font-size')) || 0;
      let fontWeight = el.getAttribute('font-weight') || '';
      let fontStyle = el.getAttribute('font-style') || '';
      let fill = el.getAttribute('fill') || '';
      let textAnchor = el.getAttribute('text-anchor') || '';

      let p = el.parentNode;
      while (p && p !== root && p.getAttribute) {
        if (!fontFamily) fontFamily = p.getAttribute('font-family') || '';
        if (!fontSize) {
          const fsAttr = p.getAttribute('font-size');
          if (fsAttr) fontSize = parseFloat(fsAttr) || 0;
        }
        if (!fontWeight) fontWeight = p.getAttribute('font-weight') || '';
        if (!fontStyle) fontStyle = p.getAttribute('font-style') || '';
        if (!fill) fill = p.getAttribute('fill') || '';
        if (!textAnchor) textAnchor = p.getAttribute('text-anchor') || '';
        // 累積父層的 translate transform
        const tr = p.getAttribute('transform');
        if (tr) {
          const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(tr);
          if (m) { x += parseFloat(m[1]); y += parseFloat(m[2]); }
        }
        p = p.parentNode;
      }

      // 預設值
      if (!fontFamily) fontFamily = 'Tahoma, sans-serif';
      if (!fontSize) fontSize = 16;
      if (!fill) fill = '#000000';

      // text-anchor → 我的 textAlign 映射 + bbox 左上計算
      // SVG <text> 的 x, y 是「baseline 錨點」，需轉換成 bbox 左上
      let textAlign = 'left';
      const estWidth = Math.max(40, text.length * fontSize * 0.7);
      const estHeight = fontSize * 1.4;
      let bboxX;
      if (textAnchor === 'middle') { textAlign = 'center'; bboxX = x - estWidth / 2; }
      else if (textAnchor === 'end') { textAlign = 'right'; bboxX = x - estWidth; }
      else { bboxX = x; }
      const bboxY = y - fontSize;

      const obj = createObject('text', {
        x: (bboxX - vb.x) * sx + ox,
        y: (bboxY - vb.y) * sy + oy,
        w: estWidth * sx,
        h: estHeight * sy,
        text,
        useForeignObject: true,
      });
      obj.fontFamily = fontFamily.replace(/['"]/g, '') + ', sans-serif';
      obj.fontSize = Math.max(3, fontSize * Math.min(sx, sy));
      obj.fontWeight = (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600) ? 'bold' : 'normal';
      obj.fontStyle = fontStyle === 'italic' ? 'italic' : 'normal';
      obj.textColor = fill;
      obj.textAlign = textAlign;
      obj.textVAlign = 'middle';
      obj.fillEnabled = false;
      obj.strokeEnabled = false;
      obj.name = uid('text');
      newObjs.push(obj);
    });

    // 三、把新物件加進 state，並移除 compound 與其 ghosts
    const compoundIdx = state.objects.findIndex((o) => o.id === compound.id);
    const ghostIds = new Set(
      state.objects
        .filter((o) => o.ghostFor && o.ghostFor.compoundId === compound.id)
        .map((o) => o.id)
    );
    state.objects = state.objects.filter((o) => o.id !== compound.id && !ghostIds.has(o.id));
    // 把新物件插在原 compound 位置（保留圖層次序）
    state.objects.splice(compoundIdx, 0, ...newObjs);
    return newObjs;
  }

  function decomposeElementToObject(el, ox, oy, sx, sy, vb) {
    const tag = el.nodeName.toLowerCase();
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    const strokeWidth = (parseFloat(el.getAttribute('stroke-width')) || 1) * Math.min(sx, sy);
    const common = {
      fill: fill && fill !== 'none' ? fill : '#FFFFFF',
      fillEnabled: !!(fill && fill !== 'none'),
      stroke: stroke && stroke !== 'none' ? stroke : '#333',
      strokeEnabled: !!(stroke && stroke !== 'none'),
      strokeWidth,
    };
    const toX = (v) => (v - vb.x) * sx + ox;
    const toY = (v) => (v - vb.y) * sy + oy;
    const toSX = (v) => v * sx;
    const toSY = (v) => v * sy;

    if (tag === 'rect') {
      const x = parseFloat(el.getAttribute('x')) || 0;
      const y = parseFloat(el.getAttribute('y')) || 0;
      const w = parseFloat(el.getAttribute('width')) || 0;
      const h = parseFloat(el.getAttribute('height')) || 0;
      if (w === 0 || h === 0) return null;
      const obj = createObject('rect', { x: toX(x), y: toY(y), w: toSX(w), h: toSY(h) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'circle') {
      const cx = parseFloat(el.getAttribute('cx')) || 0;
      const cy = parseFloat(el.getAttribute('cy')) || 0;
      const r = parseFloat(el.getAttribute('r')) || 0;
      if (r === 0) return null;
      const obj = createObject('ellipse', { x: toX(cx - r), y: toY(cy - r), w: toSX(r * 2), h: toSY(r * 2) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx')) || 0;
      const cy = parseFloat(el.getAttribute('cy')) || 0;
      const rx = parseFloat(el.getAttribute('rx')) || 0;
      const ry = parseFloat(el.getAttribute('ry')) || 0;
      if (rx === 0 || ry === 0) return null;
      const obj = createObject('ellipse', { x: toX(cx - rx), y: toY(cy - ry), w: toSX(rx * 2), h: toSY(ry * 2) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'line') {
      const x1 = parseFloat(el.getAttribute('x1')) || 0;
      const y1 = parseFloat(el.getAttribute('y1')) || 0;
      const x2 = parseFloat(el.getAttribute('x2')) || 0;
      const y2 = parseFloat(el.getAttribute('y2')) || 0;
      const x = Math.min(x1, x2), y = Math.min(y1, y2);
      const obj = createObject('line', { x: toX(x), y: toY(y), w: Math.max(1, toSX(Math.abs(x2 - x1))), h: Math.max(1, toSY(Math.abs(y2 - y1))) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'polygon' || tag === 'polyline' || tag === 'path') {
      const bbox = approxBBox(el);
      if (bbox.w === 0 || bbox.h === 0) return null;
      const obj = createObject('shape', {
        x: toX(bbox.x), y: toY(bbox.y),
        w: toSX(bbox.w), h: toSY(bbox.h),
        shapeId: tag, shapeSvg: el.outerHTML,
        shapeViewBox: { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h },
        preserveStyle: true,
      });
      Object.assign(obj, common);
      return obj;
    }
    return null;
  }

  $('#btn-copy-style').onclick = () => {
    if (state.selected.size === 0) return;
    const src = findObj(Array.from(state.selected)[0]);
    state.clipboard = {
      fill: src.fill, fillEnabled: src.fillEnabled,
      stroke: src.stroke, strokeEnabled: src.strokeEnabled,
      strokeWidth: src.strokeWidth, strokeStyle: src.strokeStyle,
      opacity: src.opacity, shadow: src.shadow,
      fontFamily: src.fontFamily, fontSize: src.fontSize,
      textColor: src.textColor, textAlign: src.textAlign,
    };
    statusInfo.textContent = '樣式已複製';
  };

  // ====== History buttons & hotkeys ======
  $('#btn-undo').onclick = undo;
  $('#btn-redo').onclick = redo;

  document.addEventListener('keydown', (e) => {
    const tgt = e.target;
    if (tgt.matches && (tgt.matches('input, textarea, select'))) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
      if (e.key === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (e.key === 's') { e.preventDefault(); exportSvg(); return; }
      if (e.key === 'g' && !e.shiftKey) { e.preventDefault(); doGroup(); return; }
      if (e.key === 'g' && e.shiftKey) { e.preventDefault(); doUngroup(); return; }
      if (e.key === 'a') { e.preventDefault(); state.selected = new Set(state.objects.map((o) => o.id)); renderAll(); return; }
    }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
    // 方向鍵微調：單鍵 1px，Shift 10px
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && state.selected.size > 0) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      state.selected.forEach((id) => {
        const o = findObj(id);
        if (!o || o.locked) return;
        o.x += dx; o.y += dy;
      });
      renderAll();
      return;
    }
    if (e.key === 'v' || e.key === 'V') setTool('select');
    else if (e.key === 'h' || e.key === 'H') setTool('hand');
    else if (e.key === 't' || e.key === 'T') setTool('text');
    else if (e.key === 'r' || e.key === 'R') setTool('rect');
    else if (e.key === 'o' || e.key === 'O') setTool('ellipse');
    else if (e.key === 'l' || e.key === 'L') setTool('line');
    else if (e.key === 'Escape') { state.selected.clear(); renderAll(); }
  });

  // ====== Theme（持久化 + 系統偏好）======
  function applyTheme(t) {
    document.body.dataset.theme = t;
    $('#theme-label').textContent = t === 'light' ? '暗色' : '亮色';
    try { localStorage.setItem('svgeditor-theme', t); } catch (e) {}
  }
  // 啟動時同步初始按鈕文字
  applyTheme(document.body.dataset.theme || (document.documentElement.dataset.bootTheme || 'light'));
  $('#btn-theme').onclick = () => {
    applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
  };

  // ====== Modal ======
  $('#btn-help').onclick = () => $('#modal-help').classList.add('open');
  $('#btn-modal-close').onclick = () => $('#modal-help').classList.remove('open');
  $('#modal-help .modal-backdrop').onclick = () => $('#modal-help').classList.remove('open');

  // ====== File I/O ======
  const fileInput = $('#file-input');
  $('#btn-open').onclick = () => { fileInput.accept = '.svg,image/svg+xml,.png,image/png,.jpg,.jpeg,image/jpeg'; fileInput.click(); };
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f, idx) => importFile(f, idx, files.length));
    fileInput.value = '';
  });

  function importFile(file, idx, total) {
    const reader = new FileReader();
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      reader.onload = (ev) => importSvgString(String(ev.target.result), file.name, idx, total);
      reader.readAsText(file);
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png') ||
               file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)) {
      reader.onload = (ev) => {
        const href = String(ev.target.result);
        // 透過 Image 探測自然尺寸以自動縮放
        const probe = new Image();
        probe.onload = () => {
          const nw = probe.naturalWidth || 320;
          const nh = probe.naturalHeight || 240;
          const margin = 40;
          const scale = Math.min(
            (CANVAS_W - margin * 2) / nw,
            (CANVAS_H - margin * 2) / nh,
            1
          );
          const fitW = nw * scale;
          const fitH = nh * scale;
          const obj = createObject('image', {
            x: (CANVAS_W - fitW) / 2 + (idx || 0) * 16,
            y: (CANVAS_H - fitH) / 2 + (idx || 0) * 16,
            w: fitW, h: fitH, imgHref: href,
          });
          obj.fillEnabled = false;
          obj.strokeEnabled = false;
          obj.name = uid('img');
          addObject(obj, '匯入圖片');
          statusInfo.textContent = `已匯入：${file.name}（${nw}×${nh} → ${Math.round(scale * 100)}%）`;
        };
        probe.src = href;
      };
      reader.readAsDataURL(file);
    }
  }

  function importSvgString(svgStr, fileName, idx) {
    try {
      const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
      const root = doc.documentElement;
      if (root.nodeName !== 'svg') {
        statusInfo.textContent = '無法解析 SVG 檔案';
        return;
      }
      // 取得原始尺寸
      let vbX = 0, vbY = 0;
      let baseW = parseFloat(root.getAttribute('width')) || 0;
      let baseH = parseFloat(root.getAttribute('height')) || 0;
      const vb = root.getAttribute('viewBox');
      if (vb) {
        const p = vb.split(/[\s,]+/).map(parseFloat);
        if (p.length === 4) { vbX = p[0]; vbY = p[1]; baseW = p[2]; baseH = p[3]; }
      }
      if (!baseW) baseW = 800;
      if (!baseH) baseH = 600;

      // 自動縮放至畫布（保留 5% 邊距）
      const margin = 40;
      const scale = Math.min(
        (CANVAS_W - margin * 2) / baseW,
        (CANVAS_H - margin * 2) / baseH,
        1
      );
      const fitW = baseW * scale;
      const fitH = baseH * scale;
      const ox = (CANVAS_W - fitW) / 2 + (idx || 0) * 16;
      const oy = (CANVAS_H - fitH) / 2 + (idx || 0) * 16;

      // 偵測 draw.io / mxGraph 風格（含 foreignObject）
      const foreignList = root.querySelectorAll('foreignObject');
      const hasForeign = foreignList.length > 0;

      let addedCount = 0;
      if (hasForeign) {
        // 一、複合 shape：保留原始 SVG 完整內容（含 foreignObject）
        //    視覺由瀏覽器原生渲染，無條件還原 draw.io 排版
        const compound = createObject('shape', {
          x: ox, y: oy, w: fitW, h: fitH,
          shapeId: 'imported-svg',
          shapeSvg: root.innerHTML,
          shapeViewBox: { x: vbX, y: vbY, w: baseW, h: baseH },
          preserveStyle: true,
        });
        compound.fillEnabled = false;
        compound.strokeEnabled = false;
        compound.name = uid('svg');
        state.objects.push(compound);
        addedCount = 1;

        // 二、為每一個 foreignObject 建立對應的 Ghost 文字物件
        //    - 視覺：無（已由 compound 提供）
        //    - 功能：提供 hit-test 區域 + 雙向綁定編輯
        let foreignCounter = 0;
        foreignList.forEach((fo) => {
          const text = (fo.textContent || '').replace(/\s+/g, ' ').trim();
          if (!text) return;
          // 取得 parent g 的 transform: translate(x,y)
          let tx = 0, ty = 0;
          let parent = fo.parentNode;
          while (parent && parent !== root) {
            const t = parent.getAttribute && parent.getAttribute('transform');
            if (t) {
              const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(t);
              if (m) { tx += parseFloat(m[1]); ty += parseFloat(m[2]); break; }
            }
            parent = parent.parentNode;
          }
          const wf = parseFloat(fo.getAttribute('width')) || 80;
          const hf = parseFloat(fo.getAttribute('height')) || 20;
          // 嘗試讀取內部 div 的字型 / 顏色
          let fontFamily = 'Tahoma, sans-serif';
          let fontSize = 12;
          let textColor = '#1F2937';
          const inner = fo.querySelector('div, span, p');
          if (inner) {
            const style = inner.getAttribute('style') || '';
            const ff = /font-family:\s*([^;"]+)/i.exec(style);
            const fs = /font-size:\s*([\d.]+)px/i.exec(style);
            const co = /color:\s*(rgb\([^)]+\)|#[0-9a-f]{3,8})/i.exec(style);
            if (ff) fontFamily = ff[1].trim() + ', sans-serif';
            if (fs) fontSize = parseFloat(fs[1]);
            if (co) textColor = co[1];
          }

          // Ghost 物件用 hit-test bbox，依原始 foreignObject 比例縮放即可
          const finalW = Math.max(8, wf * scale);
          const finalH = Math.max(8, hf * scale);

          const obj = createObject('text', {
            x: (tx - vbX) * scale + ox,
            y: (ty - vbY) * scale + oy,
            w: finalW,
            h: finalH,
            text,
            ghostFor: { compoundId: compound.id, foreignIndex: foreignCounter },
          });
          foreignCounter += 1;
          obj.fontFamily = fontFamily;
          obj.fontSize = Math.max(6, fontSize * scale);
          obj.textColor = textColor;
          obj.fillEnabled = false;
          obj.strokeEnabled = false;
          obj.textAlign = 'center';
          obj.textVAlign = 'middle';
          obj.name = uid('text');
          state.objects.push(obj);
          addedCount += 1;
        });
        statusInfo.textContent = `已匯入 draw.io 格式：${fileName}（含 ${foreignList.length} 個文字標籤，可於右側「文字」分頁直接編輯）`;
      } else {
        // 一般 SVG：逐元素解析
        const elements = root.querySelectorAll('rect, circle, ellipse, line, polygon, polyline, path, text');
        elements.forEach((el) => {
          const obj = parseSvgElement(el, ox, oy, scale, vbX, vbY);
          if (obj) {
            obj.name = uid(obj.type);
            state.objects.push(obj);
            addedCount += 1;
          }
        });
        if (addedCount === 0) {
          const obj = createObject('shape', {
            x: ox, y: oy, w: fitW, h: fitH,
            shapeId: 'imported', shapeSvg: root.innerHTML,
            shapeViewBox: { x: vbX, y: vbY, w: baseW, h: baseH },
            preserveStyle: true,
          });
          obj.fillEnabled = false; obj.strokeEnabled = false;
          obj.name = uid('svg');
          state.objects.push(obj);
          addedCount = 1;
        }
        statusInfo.textContent = `已匯入：${fileName}（${addedCount} 個物件，縮放 ${Math.round(scale * 100)}%）`;
      }

      renderAll();
      pushHistory('匯入 SVG', fileName);
    } catch (err) {
      statusInfo.textContent = 'SVG 解析失敗：' + err.message;
      console.error(err);
    }
  }

  function parseSvgElement(el, ox, oy, scale, vbX, vbY) {
    scale = scale || 1; vbX = vbX || 0; vbY = vbY || 0;
    const tag = el.nodeName.toLowerCase();
    const fill = el.getAttribute('fill') || '#FFFFFF';
    const stroke = el.getAttribute('stroke') || '#333333';
    const strokeWidth = (parseFloat(el.getAttribute('stroke-width')) || 1) * scale;
    const common = { fill: fill === 'none' ? '#FFFFFF' : fill, fillEnabled: fill !== 'none', stroke, strokeEnabled: stroke !== 'none', strokeWidth };
    const toX = (v) => (v - vbX) * scale + ox;
    const toY = (v) => (v - vbY) * scale + oy;
    const toS = (v) => v * scale;
    if (tag === 'rect') {
      const x = parseFloat(el.getAttribute('x')) || 0;
      const y = parseFloat(el.getAttribute('y')) || 0;
      const w = parseFloat(el.getAttribute('width')) || 0;
      const h = parseFloat(el.getAttribute('height')) || 0;
      const obj = createObject('rect', { x: toX(x), y: toY(y), w: toS(w), h: toS(h) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'circle') {
      const cx = parseFloat(el.getAttribute('cx')) || 0;
      const cy = parseFloat(el.getAttribute('cy')) || 0;
      const r = parseFloat(el.getAttribute('r')) || 0;
      const obj = createObject('ellipse', { x: toX(cx - r), y: toY(cy - r), w: toS(r * 2), h: toS(r * 2) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx')) || 0;
      const cy = parseFloat(el.getAttribute('cy')) || 0;
      const rx = parseFloat(el.getAttribute('rx')) || 0;
      const ry = parseFloat(el.getAttribute('ry')) || 0;
      const obj = createObject('ellipse', { x: toX(cx - rx), y: toY(cy - ry), w: toS(rx * 2), h: toS(ry * 2) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'line') {
      const x1 = parseFloat(el.getAttribute('x1')) || 0;
      const y1 = parseFloat(el.getAttribute('y1')) || 0;
      const x2 = parseFloat(el.getAttribute('x2')) || 0;
      const y2 = parseFloat(el.getAttribute('y2')) || 0;
      const x = Math.min(x1, x2), y = Math.min(y1, y2);
      const obj = createObject('line', { x: toX(x), y: toY(y), w: Math.max(1, toS(Math.abs(x2 - x1))), h: Math.max(1, toS(Math.abs(y2 - y1))) });
      Object.assign(obj, common);
      return obj;
    }
    if (tag === 'text') {
      const x = parseFloat(el.getAttribute('x')) || 0;
      const y = parseFloat(el.getAttribute('y')) || 0;
      const fs = (parseFloat(el.getAttribute('font-size')) || 16) * scale;
      const obj = createObject('text', { x: toX(x) - 60, y: toY(y) - fs, w: 120, h: fs * 1.6, text: el.textContent || '' });
      obj.fontFamily = el.getAttribute('font-family') || obj.fontFamily;
      obj.fontSize = fs;
      obj.textColor = el.getAttribute('fill') || obj.textColor;
      obj.fillEnabled = false;
      obj.strokeEnabled = false;
      return obj;
    }
    if (tag === 'polygon' || tag === 'polyline' || tag === 'path') {
      const wrapper = el.outerHTML;
      const bbox = approxBBox(el);
      const obj = createObject('shape', {
        x: toX(bbox.x), y: toY(bbox.y),
        w: toS(bbox.w), h: toS(bbox.h),
        shapeId: tag, shapeSvg: wrapper,
        shapeViewBox: { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h },
        preserveStyle: true,
      });
      Object.assign(obj, common);
      return obj;
    }
    return null;
  }

  function approxBBox(el) {
    try {
      stage.appendChild(el.cloneNode(true));
      const last = stage.lastChild;
      const b = last.getBBox();
      stage.removeChild(last);
      return { x: b.x, y: b.y, w: Math.max(20, b.width), h: Math.max(20, b.height) };
    } catch (e) {
      return { x: 0, y: 0, w: 100, h: 60 };
    }
  }

  // 拖曳檔案至視窗
  ['dragenter', 'dragover'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
      e.preventDefault();
      dropOverlay.classList.add('show');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (evt === 'dragleave' && e.relatedTarget) return;
      dropOverlay.classList.remove('show');
    });
  });
  document.addEventListener('drop', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f, i) => importFile(f, i, files.length));
  });

  // ====== 匯出 ======
  function buildExportSvg() {
    const w = 1200, h = 800;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', w); bg.setAttribute('height', h); bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);
    state.objects.forEach((o) => {
      const el = renderObject(o);
      if (el) svg.appendChild(el);
    });
    return svg;
  }
  function exportSvg() {
    const svg = buildExportSvg();
    const str = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `design-${Date.now()}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusInfo.textContent = '已匯出 SVG';
  }
  function exportPng() {
    const svg = buildExportSvg();
    const str = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1200, 800);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `design-${Date.now()}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        statusInfo.textContent = '已匯出 PNG';
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(str)));
  }
  $('#btn-export-svg').onclick = exportSvg;
  $('#btn-export-png').onclick = exportPng;
  $('#btn-new').onclick = () => {
    if (state.objects.length > 0 && !confirm('確定要新建畫布？目前內容將清空。')) return;
    state.objects = []; state.selected.clear(); state.history = []; state.historyIndex = -1; state.autoCounter = 0;
    renderAll();
    pushHistory('新建畫布', '');
  };

  // 一鍵清除：保留歷史紀錄，可 Ctrl+Z 還原
  $('#btn-clear').onclick = () => {
    if (state.objects.length === 0) {
      statusInfo.textContent = '畫布已是空的';
      return;
    }
    if (!confirm(`確定要清除畫布上的 ${state.objects.length} 個物件嗎？\n（可使用 Ctrl+Z 還原）`)) return;
    const count = state.objects.length;
    state.objects = [];
    state.selected.clear();
    renderAll();
    pushHistory('清除畫布', `${count} 個物件`);
    statusInfo.textContent = `已清除 ${count} 個物件`;
  };

  // ====== 初始化示範內容 ======
  function seedDemo() {
    const make = (props) => Object.assign(createObject(props.type, props), props);
    const start = make({ type: 'shape', shapeId: 'flow-terminator', shapeSvg: window.__SHAPES__[2].items[2].svg, x: 480, y: 80, w: 220, h: 80, fill: '#D6E4F5', stroke: '#4A90E2', text: '開始流程', textColor: '#1F2937', fontSize: 20 });
    start.name = 'item-01';
    const step1 = make({ type: 'shape', shapeId: 'flow-process', shapeSvg: window.__SHAPES__[2].items[0].svg, x: 480, y: 220, w: 220, h: 80, fill: '#FFFFFF', stroke: '#333', text: '讀取 SVG 檔案', fontSize: 18 });
    step1.name = 'item-02';
    const decision = make({ type: 'shape', shapeId: 'flow-decision', shapeSvg: window.__SHAPES__[2].items[1].svg, x: 460, y: 350, w: 260, h: 130, fill: '#FFF4C9', stroke: '#E0A700', text: '是否包含文字圖層？', fontSize: 16 });
    decision.name = 'item-03';
    const yes = make({ type: 'shape', shapeId: 'flow-process', shapeSvg: window.__SHAPES__[2].items[0].svg, x: 240, y: 530, w: 220, h: 80, fill: '#D9EFE0', stroke: '#5AC8A5', text: '進入文字編輯模式', fontSize: 18 });
    yes.name = 'item-04';
    const no = make({ type: 'shape', shapeId: 'flow-process', shapeSvg: window.__SHAPES__[2].items[0].svg, x: 720, y: 530, w: 220, h: 80, fill: '#FFE5D0', stroke: '#FFB74D', text: '套用向量樣式', fontSize: 18 });
    no.name = 'item-05';
    const end = make({ type: 'shape', shapeId: 'flow-terminator', shapeSvg: window.__SHAPES__[2].items[2].svg, x: 480, y: 660, w: 220, h: 80, fill: '#FFD7E0', stroke: '#F06292', text: '匯出 / 完成', fontSize: 20 });
    end.name = 'item-06';

    // 連接線
    const line = (x1, y1, x2, y2) => {
      const o = createObject('line', { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 2, h: Math.abs(y2 - y1) || 2, stroke: '#4B5563' });
      o.fillEnabled = false; o.strokeWidth = 1.5;
      return o;
    };
    const arrow = (x1, y1, x2, y2, label) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const w = len, h = 24;
      const o = createObject('shape', {
        x: cx - w / 2, y: cy - h / 2, w, h,
        shapeId: 'connector',
        shapeSvg: `<line x1="0" y1="30" x2="92" y2="30" stroke="#4B5563" stroke-width="2"/><polyline points="84,22 96,30 84,38" fill="none" stroke="#4B5563" stroke-width="2"/>`,
        fill: 'transparent', stroke: '#4B5563', text: label || '',
      });
      o.rotation = Math.round(angle);
      o.fontSize = 12; o.textColor = '#4B5563';
      return o;
    };
    state.objects = [
      arrow(590, 160, 590, 220),
      arrow(590, 300, 590, 350),
      arrow(490, 415, 350, 530, '是'),
      arrow(700, 415, 830, 530, '否'),
      arrow(350, 610, 590, 660),
      arrow(830, 610, 590, 660),
      start, step1, decision, yes, no, end,
    ];
    state.autoCounter = 6;
    renderAll();
    pushHistory('範例流程圖載入', '');
  }

  // ====== 範本面板 ======
  function renderTemplates() {
    const host = $('#template-grid');
    if (!host) return;
    const list = (window.__TEMPLATES__ || []);
    host.innerHTML = '';
    list.forEach((tpl) => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.dataset.tplId = tpl.id;
      item.title = `套用範本：${tpl.name}`;
      item.innerHTML = `
        <div class="thumb"><svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">${tpl.thumb}</svg></div>
        <div class="meta">
          <span class="name">${tpl.name}</span>
          <span class="cat">${tpl.category}</span>
        </div>
      `;
      item.addEventListener('click', () => applyTemplate(tpl));
      host.appendChild(item);
    });
  }

  function applyTemplate(tpl) {
    if (!tpl || typeof tpl.build !== 'function') return;
    const hasContent = state.objects.length > 0;
    if (hasContent) {
      if (!confirm(`即將載入「${tpl.name}」範本，目前畫布上的 ${state.objects.length} 個物件將被清除。\n（可使用 Ctrl+Z 還原）\n\n確定要套用嗎？`)) return;
    }
    // 清空現有並寫入歷史
    state.objects = [];
    state.selected.clear();
    // 建立範本物件並補上 id
    const objs = tpl.build();
    objs.forEach((o) => {
      const obj = createObject(o.type, o);
      Object.assign(obj, o);
      obj.id = uid(o.type);
      obj.name = obj.id;
      state.objects.push(obj);
    });
    renderAll();
    pushHistory('套用範本', tpl.name);
    statusInfo.textContent = `已套用範本：${tpl.name}（${objs.length} 個物件）`;
  }

  // 左側分頁切換
  $$('.panel-tabs [data-leftab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.panel-tabs [data-leftab]').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.dataset.leftab;
      $$('.left-pane').forEach((p) => p.classList.toggle('active', p.dataset.leftpane === pane));
      if (pane === 'templates') renderTemplates();
    });
  });

  // ====== Boot ======
  renderShapeLibrary();
  renderTemplates();
  renderPresets();
  setZoom(0.8);
  // 空白畫布，無預設範例
  pushHistory('初始化', '');
  renderAll();
})();
