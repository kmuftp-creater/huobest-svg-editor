/**
 * 從 範本/new/ 內的 SVG 檔自動生成 templates-data.js
 *
 * 處理重點：
 * 1. 解析 SVG 取出 viewBox 與內部 innerHTML
 * 2. 自動為 CSS 類名加上範本 id 前綴，避免多個範本同時載入時 .bg / .title 等衝突
 * 3. 輸出單一 JS 檔，含 window.__TEMPLATE_SVGS__ 陣列
 *
 * 使用：node generate-templates.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '範本', 'new');
const OUT_FILE = path.join(__dirname, 'templates-data.js');

// 跳過清單：保留檔案於資料夾備份，但不收錄至範本庫
const SKIP_FILES = new Set([
  'AI工具分類心智圖.svg',   // 已被 2026 版取代（依使用者要求）
]);

// 範本中文化名稱與分類對應表
const META = {
  '10個高雄旅遊景點推薦_右側心智圖頭尾修正版_SVG.svg': { name: '高雄景點心智圖', category: '心智圖' },
  'AI工具分類心智圖.svg': { name: 'AI 工具分類', category: '心智圖' },
  'AI工具分類心智圖2026.svg': { name: 'AI 工具分類 (2026)', category: '心智圖' },
  'PMP 十大知識領域心智圖_不裁切版 SVG.svg': { name: 'PMP 十大領域', category: '心智圖' },
  '商業模式畫布分析圖 SVG.svg': { name: '商業模式畫布', category: '矩陣' },
  '專案成員結構圖 SVG.svg': { name: '專案成員結構', category: '結構' },
  '彩色 6M 分析版魚骨圖 SVG.svg': { name: '6M 魚骨圖', category: '分析' },
  '彩色台灣家族稱謂版家族族譜圖 SVG.svg': { name: '台灣家族族譜', category: '結構' },
  '彩色客服處理流程泳道圖 SVG.svg': { name: '客服流程泳道圖', category: '流程' },
  '彩色課程平台 UML 使用案例圖 SVG.svg': { name: '課程平台 UML', category: 'UML' },
  '彩色部門標籤版｜部門成員結構圖 SVG.svg': { name: '部門成員結構', category: '結構' },
  '時間軸分析法 SVG 圖.svg': { name: '時間軸分析法', category: '時序' },
  '粉彩流程圖 SVG 模板.svg': { name: '粉彩流程圖', category: '流程' },
  '約會聊天教學.svg': { name: '聊天溝通教學', category: '思考' },
};

// CSS 類名範圍化：把 .foo 改為 .{scope}-foo，避免多範本同時存在於同一 DOM 時類名衝突
function scopeClasses(svgContent, scope) {
  // 1. 找出 <style> 內定義的所有類名
  const styleMatches = [...svgContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
  if (styleMatches.length === 0) return svgContent;

  const classNames = new Set();
  styleMatches.forEach((m) => {
    const cssText = m[1];
    const re = /\.([A-Za-z][A-Za-z0-9_-]*)\b/g;
    let mm;
    while ((mm = re.exec(cssText)) !== null) {
      classNames.add(mm[1]);
    }
  });

  // 為了避免無窮迴圈（scoped 仍包含原 cls 子串），改為：
  // 先把所有 class 屬性內容用 token 化處理（split by space、map、join）
  // 然後做 CSS 選擇器替換
  let result = svgContent;

  // 替換 class="..." 屬性內的 token
  result = result.replace(/class\s*=\s*"([^"]*)"/g, (match, classes) => {
    const tokens = classes.split(/\s+/).filter(Boolean).map((t) => {
      return classNames.has(t) ? `${scope}-${t}` : t;
    });
    return `class="${tokens.join(' ')}"`;
  });
  result = result.replace(/class\s*=\s*'([^']*)'/g, (match, classes) => {
    const tokens = classes.split(/\s+/).filter(Boolean).map((t) => {
      return classNames.has(t) ? `${scope}-${t}` : t;
    });
    return `class='${tokens.join(' ')}'`;
  });

  // 替換 <style> 內的 CSS 選擇器
  // 用排序由長到短，避免 .foo 替換在 .foobar 之前
  const sortedClasses = Array.from(classNames).sort((a, b) => b.length - a.length);
  result = result.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) => {
    let newCss = css;
    sortedClasses.forEach((cls) => {
      // 只替換 .cls（後接非字母數字、底線、連字號）
      const re = new RegExp(`\\.${cls}(?![A-Za-z0-9_-])`, 'g');
      newCss = newCss.replace(re, `.${scope}-${cls}`);
    });
    return `<style${attrs}>${newCss}</style>`;
  });

  return result;
}

function extractSvg(content) {
  // 取得 viewBox / width / height
  const vbMatch = content.match(/<svg[^>]*\sviewBox=["']([^"']+)["']/);
  const wMatch = content.match(/<svg[^>]*\swidth=["']([^"']+)["']/);
  const hMatch = content.match(/<svg[^>]*\sheight=["']([^"']+)["']/);
  // 內層 innerHTML（去掉外層 <svg ...> 與 </svg>）
  const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>\s*$/);

  const vb = vbMatch ? vbMatch[1].trim().split(/\s+/).map(parseFloat) : null;
  const w = wMatch ? parseFloat(wMatch[1]) : (vb ? vb[2] : 1200);
  const h = hMatch ? parseFloat(hMatch[1]) : (vb ? vb[3] : 800);
  const inner = innerMatch ? innerMatch[1].trim() : '';
  return { width: w, height: h, viewBox: vb || [0, 0, w, h], inner };
}

function build() {
  const files = fs.readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.svg'))
    .filter((f) => !SKIP_FILES.has(f))
    .sort();
  const templates = files.map((filename, index) => {
    const fullPath = path.join(SRC_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const meta = META[filename] || { name: filename.replace(/\.svg$/, '').slice(0, 30), category: '其他' };

    const parsed = extractSvg(content);
    // 範本 id：以 index 確保唯一，附上英數摘要 hint（檔名多為中文時 hint 可能為空）
    const hint = (filename.match(/[A-Za-z0-9]+/g) || []).join('-').toLowerCase().replace(/svg/g, '').replace(/^-+|-+$/g, '');
    const id = `tpl-${String(index).padStart(2, '0')}${hint ? '-' + hint.slice(0, 24) : ''}`;

    // Class 範圍化
    const scopedInner = scopeClasses(parsed.inner, id);

    return {
      id,
      name: meta.name,
      category: meta.category,
      viewBox: parsed.viewBox,
      width: parsed.width,
      height: parsed.height,
      inner: scopedInner,
    };
  });

  const header = `/* 自動產生：node generate-templates.js
 * 來源：範本/new/*.svg（共 ${templates.length} 個專業 SVG 範本）
 * 已自動為 CSS 類名加上範本 id 前綴，避免多範本同時載入時樣式衝突
 */\n`;
  const code = `${header}window.__TEMPLATE_SVGS__ = ${JSON.stringify(templates)};\n`;
  fs.writeFileSync(OUT_FILE, code, 'utf8');

  const totalKB = (code.length / 1024).toFixed(1);
  console.log(`Generated ${templates.length} templates → ${path.relative(__dirname, OUT_FILE)} (${totalKB} KB)`);
  templates.forEach((t) => {
    const sz = (t.inner.length / 1024).toFixed(1);
    console.log(`  ${String(t.name).padEnd(20)} ${t.viewBox.slice(2).join('×').padEnd(12)} ${sz} KB`);
  });
}

build();
