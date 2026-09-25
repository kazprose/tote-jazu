/**
 * mirror.ts тестілері:  npm test
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  transformHtmlToTote,
  addHreflangToOriginal,
  transformRssToTote,
  addToteUrlsToSitemap,
  mirrorDirectory,
} from '../src/mirror.ts';

let pass = 0;
let fail = 0;
function ok(cond: boolean, name: string, detail = '') {
  if (cond) { console.log(`✓ ${name}`); pass++; }
  else { console.error(`✗ ${name}${detail ? '\n  ' + detail : ''}`); fail++; }
}

const opts = { site: 'https://example.kz/', skipHrefPrefixes: ['/api.php'] };

const page = `<!doctype html><html lang="kk"><head><title>Өлеңдер</title>
<link rel="canonical" href="https://example.kz/poems">
<link rel="stylesheet" href="/_astro/x.css"></head>
<body class="page"><a href="/">Басты</a><a href="/poems/alash">Алаш</a>
<a href="/images/a.jpg">сурет</a><a href="/api.php?x=1">api</a><a href="https://x.kz/">сыртқы</a>
<a href="#top">жоғары</a><a href="/tote/poems">бар</a>
<a href="#" data-tote-switch data-tote-skip>Төте</a>
<a href="#" data-i18n="lang-switch">Төте</a></body></html>`;

const out = transformHtmlToTote(page, '/poems.html', opts);
ok(out.includes('<html lang="kk" dir="rtl">'), 'html dir="rtl" қосылды');
ok(out.includes('<body class="tote page">'), 'body class="tote" қосылды');
ok(out.includes('<link rel="canonical" href="https://example.kz/tote/poems">'), 'canonical /tote/-ге');
ok(out.includes('hreflang="kk" href="https://example.kz/poems"'), 'hreflang kk');
ok(out.includes('hreflang="kk-Arab" href="https://example.kz/tote/poems"'), 'hreflang kk-Arab');
ok(out.includes('href="/tote/"'), '/ → /tote/');
ok(out.includes('href="/tote/poems/alash"'), 'ішкі сілтеме префикстелді');
ok(out.includes('href="/images/a.jpg"'), 'сурет сілтемесі тиілмейді');
ok(out.includes('href="/api.php?x=1"'), 'skipHrefPrefixes жұмыс істейді');
ok(out.includes('href="/_astro/x.css"'), '/_astro/ тиілмейді');
ok(out.includes('href="https://x.kz/"'), 'сыртқы сілтеме тиілмейді');
ok(out.includes('href="#top"'), '# тиілмейді');
ok(out.includes('href="/tote/poems"') && !out.includes('/tote/tote'), '/tote/ қайта префикстелмейді');
ok(out.includes('data-tote-skip>Төте</a>'), 'data-tote-skip мәтіні аударылмайды');
ok(out.includes('data-i18n="lang-switch">Төте</a>'), 'data-i18n="lang-switch" мәтіні аударылмайды');
ok(out.includes('<title>ولەڭدەر</title>'), 'мәтін аударылды');

const idx = transformHtmlToTote('<html><head></head><body></body></html>', '/index.html', opts);
ok(idx.includes('hreflang="kk-Arab" href="https://example.kz/tote"'), 'index → /tote');
const rssLink = transformHtmlToTote('<html><head><link rel="alternate" href="/poems/rss.xml"></head></html>', '/a.html', opts);
ok(rssLink.includes('href="/tote/poems/rss.xml"'), 'RSS сілтемесі /tote/-ге');

const custom = transformHtmlToTote('<html><head></head><body><a href="/a">а</a></body></html>', '/a.html', { ...opts, prefix: 'arab/' });
ok(custom.includes('href="/arab/a"'), 'custom prefix');

const orig = addHreflangToOriginal('<html><head></head></html>', '/poems/x.html', opts);
ok(orig.includes('hreflang="kk-Arab" href="https://example.kz/tote/poems/x"'), 'кирилл бетке hreflang');
ok(addHreflangToOriginal(orig, '/poems/x.html', opts) === orig, 'hreflang екі рет қосылмайды');

const rss = transformRssToTote('<rss><channel><title>Алаш</title><link>https://example.kz/poems</link><item><description>Сәлем</description></item></channel></rss>', opts);
ok(rss.includes('<title>الاش</title>') && rss.includes('<description>سالەم</description>'), 'RSS аударылды');
ok(rss.includes('<link>https://example.kz/tote/poems</link>'), 'RSS link /tote/');

const sm = '<urlset><url><loc>https://example.kz/</loc></url><url><loc>https://example.kz/poems</loc></url></urlset>';
const sm2 = addToteUrlsToSitemap(sm, opts);
ok(sm2.includes('<loc>https://example.kz/tote/</loc>') && sm2.includes('<loc>https://example.kz/tote/poems</loc>'), 'sitemap-ке /tote/ URL');
ok(addToteUrlsToSitemap(sm2, opts) === sm2, 'sitemap екі рет қосылмайды');
const smRoot = addToteUrlsToSitemap('<urlset><url><loc>https://example.kz</loc></url></urlset>', opts);
ok(smRoot.includes('<loc>https://example.kz/tote</loc>'), 'sitemap: слэшсіз түбір → /tote');

// ============ mirrorDirectory ============
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tote-jazu-'));
await fs.mkdir(path.join(tmp, 'poems'), { recursive: true });
await fs.writeFile(path.join(tmp, 'index.html'), '<html><head></head><body>Сәлем</body></html>');
await fs.writeFile(path.join(tmp, 'poems/x.html'), '<html><head></head><body><a href="/poems">Алаш</a></body></html>');
await fs.writeFile(path.join(tmp, 'poems/rss.xml'), '<rss><title>Алаш</title></rss>');
await fs.writeFile(path.join(tmp, 'sitemap-0.xml'), sm);
const n = await mirrorDirectory(tmp, { ...opts, rssFiles: ['poems/rss.xml'] });
ok(n === 2, 'mirrorDirectory: 2 бет');
ok((await fs.readFile(path.join(tmp, 'tote/poems/x.html'), 'utf-8')).includes('href="/tote/poems"'), 'tote/poems/x.html жасалды');
ok((await fs.readFile(path.join(tmp, 'tote/index.html'), 'utf-8')).includes('سالەم'), 'tote/index.html аударылды');
ok((await fs.readFile(path.join(tmp, 'tote/poems/rss.xml'), 'utf-8')).includes('الاش'), 'tote RSS жасалды');
ok((await fs.readFile(path.join(tmp, 'index.html'), 'utf-8')).includes('hreflang="kk-Arab"'), 'кирилл бетке hreflang жазылды');
ok((await fs.readFile(path.join(tmp, 'sitemap-0.xml'), 'utf-8')).includes('/tote/poems'), 'sitemap жаңартылды');
const n2 = await mirrorDirectory(tmp, opts);
ok(n2 === 2, 'қайта жүгіргенде tote/ папкасы қайта өңделмейді');
await fs.rm(tmp, { recursive: true, force: true });

console.log('\n' + '='.repeat(40));
console.log(`Mirror тестілері: ${pass} өтті, ${fail} жығылды`);
console.log('='.repeat(40));
if (fail > 0) process.exit(1);
