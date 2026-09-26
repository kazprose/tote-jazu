// css/tote.css + fonts/KazNet.woff2 → client/font.js (қаріп base64 түрінде ішінде)
// Нәтиже: `import 'tote-jazu/font'` немесе <script src="client/font.js"> — файл жолдарын баптаусыз жұмыс істейді.
import { readFileSync, writeFileSync } from 'node:fs';

const woff2 = readFileSync(new URL('../fonts/KazNet.woff2', import.meta.url)).toString('base64');
const css = readFileSync(new URL('../css/tote.css', import.meta.url), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/src:[^;]+;/, `src: url(data:font/woff2;base64,${woff2}) format('woff2');`)
  .replace(/\s*\n\s*/g, '\n')
  .trim();

const js = `/* tote-jazu: KazNet қарпі мен төте стилін бетке қосады. АВТОМАТТЫ ГЕНЕРАЦИЯ — scripts/build-font.mjs */
(function () {
  if (typeof document === 'undefined' || document.getElementById('tote-jazu-font')) return;
  var s = document.createElement('style');
  s.id = 'tote-jazu-font';
  s.textContent = ${JSON.stringify(css)};
  (document.head || document.documentElement).appendChild(s);
})();
`;
writeFileSync(new URL('../client/font.js', import.meta.url), js);
console.log(`client/font.js: ${(js.length / 1024).toFixed(1)} KB`);
