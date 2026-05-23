/**
 * 霍家私塾 SVG 編輯器 — 單檔打包腳本
 *
 * 功能：將 index.html + styles.css + shapes.js + app.js 合併為單一 HTML 檔案
 * 用法：node build.js
 * 產出：dist/svg-editor.html
 *
 * 設計原則：
 * - 不修改原始碼邏輯，僅做檔案內聯
 * - 保留 Google Fonts CDN 連結（如需完全離線，需另外處理字型）
 * - 內聯時加註版本與建置時間，便於追蹤
 */

const fs = require('fs');
const path = require('path');

// ====== 路徑設定 ======
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const OUTPUT_NAME = 'svg-editor.html';

// ====== 讀取版本（從 index.html 的 footer 解析） ======
function readVersion(html) {
  const match = /系統版本\s+v([\d.]+)/.exec(html);
  return match ? match[1] : '0.0.0';
}

// ====== 主流程 ======
function build() {
  console.log('===========================================');
  console.log('  霍家私塾 SVG 編輯器 - 單檔打包');
  console.log('===========================================\n');

  // 1. 讀取四個來源檔
  const sources = {
    html: path.join(ROOT, 'index.html'),
    css: path.join(ROOT, 'styles.css'),
    shapes: path.join(ROOT, 'shapes.js'),
    app: path.join(ROOT, 'app.js'),
  };

  Object.entries(sources).forEach(([key, file]) => {
    if (!fs.existsSync(file)) {
      console.error(`[錯誤] 找不到檔案：${file}`);
      process.exit(1);
    }
  });

  const html = fs.readFileSync(sources.html, 'utf8');
  const css = fs.readFileSync(sources.css, 'utf8');
  const shapes = fs.readFileSync(sources.shapes, 'utf8');
  const app = fs.readFileSync(sources.app, 'utf8');

  const version = readVersion(html);
  const buildDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  console.log(`版本：v${version}`);
  console.log(`建置時間：${buildDate}\n`);

  // 2. 顯示各檔大小
  const sizes = {
    'index.html': html.length,
    'styles.css': css.length,
    'shapes.js': shapes.length,
    'app.js': app.length,
  };
  Object.entries(sizes).forEach(([name, size]) => {
    console.log(`  ${name.padEnd(14)} ${formatSize(size)}`);
  });
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  console.log(`  ${'─'.repeat(14)}`);
  console.log(`  ${'合計'.padEnd(14)} ${formatSize(total)}\n`);

  // 3. 建置標頭註解
  const buildHeader = `<!--
  ============================================================
   霍家私塾 SVG 編輯器（HuoBest SVG Editor）
   版本：v${version}
   建置時間：${buildDate}
   官方網站：https://huobest.com/
   授權：MIT License
  ============================================================
   單檔版本：本檔案內聯所有 CSS 與 JavaScript，
   可離線開啟、單獨分享、上傳至任何靜態託管平台。
  ============================================================
-->\n`;

  // 4. 內聯 CSS
  let bundled = html.replace(
    /<link rel="stylesheet" href="styles\.css"\s*\/?>/,
    `<style>\n/* === styles.css === */\n${css}\n</style>`
  );

  // 5. 內聯 shapes.js（順序：shapes 必須先於 app）
  bundled = bundled.replace(
    /<script src="shapes\.js"><\/script>/,
    `<script>\n/* === shapes.js === */\n${shapes}\n</script>`
  );

  // 6. 內聯 app.js
  bundled = bundled.replace(
    /<script src="app\.js"><\/script>/,
    `<script>\n/* === app.js === */\n${app}\n</script>`
  );

  // 7. 加上建置標頭（緊接 <!DOCTYPE html> 之後）
  bundled = bundled.replace(/^(<!DOCTYPE[^>]+>\s*)/, `$1${buildHeader}`);

  // 8. 寫入 dist
  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
    console.log(`[建立] ${DIST}`);
  }
  const outputPath = path.join(DIST, OUTPUT_NAME);
  fs.writeFileSync(outputPath, bundled);

  // 9. 驗證：檢查替換是否成功
  const checks = {
    '內聯 CSS': !bundled.includes('href="styles.css"') && bundled.includes('/* === styles.css === */'),
    '內聯 shapes.js': !bundled.includes('src="shapes.js"') && bundled.includes('/* === shapes.js === */'),
    '內聯 app.js': !bundled.includes('src="app.js"') && bundled.includes('/* === app.js === */'),
  };
  let allPass = true;
  console.log('驗證：');
  Object.entries(checks).forEach(([name, pass]) => {
    console.log(`  ${pass ? '✓' : '✗'} ${name}`);
    if (!pass) allPass = false;
  });

  if (!allPass) {
    console.error('\n[錯誤] 部分內聯未成功，請檢查 index.html 的 link/script 標籤格式');
    process.exit(1);
  }

  // 10. 完成
  const outSize = bundled.length;
  console.log('\n===========================================');
  console.log(`  打包完成`);
  console.log(`  輸出：${path.relative(ROOT, outputPath)}`);
  console.log(`  大小：${formatSize(outSize)}`);
  console.log('===========================================');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

build();
