# 部署與打包指南

## 一、現狀
專案為純前端靜態網頁，三檔分離：
- `index.html`
- `styles.css`
- `app.js` + `shapes.js`

**無 build step、無 npm 依賴、無框架**。任何能服務靜態檔案的環境都可部署。

## 二、本地執行（最簡）

### 直接開啟
雙擊 `index.html` 即可在瀏覽器執行。

**注意**：部分瀏覽器（特別是 Chrome）對 `file://` 協定有安全限制，可能影響：
- Google Fonts CDN 載入（會自動 fallback 系統字型）
- FileReader API（少數情況下）

### 本地 HTTP 伺服器（推薦）
**Python 3**：
```bash
cd "D:\Claude\SVG Editor"
python -m http.server 8000
# 開啟 http://localhost:8000
```

**Node.js**（需先安裝 `serve`）：
```bash
npx serve "D:\Claude\SVG Editor"
```

**VS Code Live Server**：
- 安裝 Live Server 擴充
- 在 `index.html` 右鍵 → Open with Live Server

## 三、打包單檔（休息後實作）

### 目標
將 `index.html` + `styles.css` + `app.js` + `shapes.js` 合併為一個 `svg-editor.html`，方便分享與離線使用。

### 實作策略 A：手動 inline
最簡單，依賴外部工具即可：

1. 開啟 `index.html`
2. 找到 `<link rel="stylesheet" href="styles.css" />`，替換為：
   ```html
   <style>
   /* paste styles.css content here */
   </style>
   ```
3. 找到 `<script src="shapes.js"></script><script src="app.js"></script>`，替換為：
   ```html
   <script>
   /* paste shapes.js content here */
   </script>
   <script>
   /* paste app.js content here */
   </script>
   ```
4. 儲存為 `svg-editor-standalone.html`

### 實作策略 B：自動化腳本
建立 `build.js`（Node.js）：

```js
// build.js
const fs = require('fs');
const path = require('path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const shapes = fs.readFileSync(path.join(root, 'shapes.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const bundled = html
  .replace(
    /<link rel="stylesheet" href="styles\.css"\s*\/?>/,
    `<style>\n${css}\n</style>`
  )
  .replace(
    /<script src="shapes\.js"><\/script>\s*<script src="app\.js"><\/script>/,
    `<script>\n${shapes}\n</script>\n<script>\n${app}\n</script>`
  );

fs.writeFileSync(path.join(root, 'dist', 'svg-editor.html'), bundled);
console.log('Built: dist/svg-editor.html');
```

執行：
```bash
mkdir dist
node build.js
```

### 實作策略 C：使用 vite-plugin-singlefile（重）
若未來想加入 build pipeline：
```bash
npm init -y
npm i vite vite-plugin-singlefile -D
```
`vite.config.js`：
```js
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'esnext' },
});
```
`npm run build` 即產生單檔。

**評估**：當前專案無需 Vite，策略 B（純 Node 腳本）已足夠。

## 四、雲端部署選項

### GitHub Pages（免費）
1. 把整個資料夾 push 到 GitHub repo
2. Settings → Pages → Source: main branch root
3. 訪問 `https://{username}.github.io/{repo}/`

### Netlify（免費 + 拖曳部署）
1. 訪問 https://app.netlify.com/drop
2. 拖曳整個資料夾上傳
3. 取得 `https://random-name.netlify.app`

### Vercel（免費 + Git 整合）
1. `npm i -g vercel`
2. `cd "D:\Claude\SVG Editor" && vercel`
3. 依提示完成設定

### Cloudflare Pages（免費 + 高速）
1. 連接 GitHub repo
2. Build command 留空、Output directory 設為 `.`
3. 自動部署

## 五、自架部署

### 靜態檔案伺服器
| 伺服器 | 配置範例 |
|---|---|
| Nginx | `location / { root /var/www/svg-editor; index index.html; }` |
| Apache | `DocumentRoot /var/www/svg-editor` |
| Caddy | `example.com { root * /var/www/svg-editor; file_server }` |

### Docker
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```
```bash
docker build -t svg-editor .
docker run -p 8080:80 svg-editor
```

## 六、離線使用

### 移除 Google Fonts 依賴
若部署在無外網環境，移除 `index.html` 中的 Google Fonts link：
```html
<!-- 移除這幾行 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />
```

CSS 會自動 fallback 到系統字型：
- 英數：system-ui、-apple-system、sans-serif
- 中文：Microsoft JhengHei（Windows）、PingFang TC（macOS）、Noto Sans TC（Linux 若已安裝）

### 字型自帶（進階）
如需保證跨平台一致：
1. 下載 Inter 與 Noto Sans TC 的 woff2 檔
2. 放入 `fonts/` 資料夾
3. CSS 加 `@font-face` 規則
4. 注意 Noto Sans TC 完整字集約 30 MB，可只取需要的字級重量

## 七、PWA 支援（roadmap）

未來加入 PWA 後可離線安裝為應用：

`manifest.json`：
```json
{
  "name": "霍家私塾 SVG 編輯器",
  "short_name": "SVG Editor",
  "start_url": "./index.html",
  "display": "standalone",
  "theme_color": "#4A90E2",
  "background_color": "#F5F7FA",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192" }, { "src": "icon-512.png", "sizes": "512x512" }]
}
```

`service-worker.js`：
```js
const CACHE_NAME = 'svg-editor-v1';
const ASSETS = ['./', './index.html', './styles.css', './shapes.js', './app.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
```

`index.html` 註冊：
```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}
</script>
<link rel="manifest" href="./manifest.json" />
```

## 八、最低系統需求

### 瀏覽器
- Chrome 90+ / Edge 90+
- Firefox 90+
- Safari 14+

### 必須的 Web API
- SVG DOM
- `<foreignObject>` 渲染（draw.io 匯入必需）
- `DOMParser` + `XMLSerializer`
- `FileReader` + `Blob` + `URL.createObjectURL`
- `localStorage`
- `Pointer Events`

## 九、部署檢查清單
| 項目 | 確認 |
|---|---|
| 三檔（index.html / styles.css / app.js / shapes.js）齊全 | ☐ |
| Google Fonts 可訪問（或已 inline） | ☐ |
| 服務器設定 `Content-Type: image/svg+xml` for `.svg` | ☐ |
| HTTPS 啟用（非本地） | ☐ |
| Console 無錯誤 | ☐ |
| 範本 SVG 匯入測試通過 | ☐ |
| 文字編輯測試通過 | ☐ |
| 匯出測試通過（SVG + PNG） | ☐ |
