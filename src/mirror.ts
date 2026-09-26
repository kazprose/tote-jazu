/**
 * Фреймворкқа тәуелсіз «төте айна» құралдары.
 *
 * Кез келген статикалық сайттың (Astro, Hugo, Eleventy, Next export, т.б.)
 * build нәтижесіндегі HTML/RSS/sitemap файлдарын алып, `<prefix>/` (әдепкі
 * `/tote/`) астына төте жазулы көшірмесін жасайды.
 *
 *  - <html dir="rtl" lang="kk">
 *  - <body class="tote ...">
 *  - canonical → .../tote/...
 *  - hreflang="kk" / hreflang="kk-Arab" жұбы (екі нұсқаға да)
 *  - Ішкі абсолют сілтемелерге /tote префиксі
 *  - RSS title/description аудару, sitemap-ке /tote/ URL-дерін қосу
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cyrl2tote, cyrl2toteHtml } from './cyrl2tote.ts';

export interface ToteMirrorOptions {
  /** Сайттың толық адресі, мысалы `https://example.kz` (соңғы `/`-сыз). */
  site: string;
  /** Төте нұсқаның URL префиксі. Әдепкі: `/tote`. */
  prefix?: string;
  /** Қосымша қайта жазылмайтын href/src префикстері (әдепкілерге қосылады). */
  skipHrefPrefixes?: string[];
  /** Аударылатын RSS файлдары (build папкасына қатысты), мысалы `['poems/rss.xml']`. */
  rssFiles?: string[];
  /** /tote/ URL-дері қосылатын sitemap файлдары. Әдепкі: `['sitemap-0.xml']`. */
  sitemapFiles?: string[];
  /** Кирилл нұсқаға да hreflang қосу керек пе. Әдепкі: `true`. */
  addHreflangToOriginal?: boolean;
  /**
   * KazNet қарпі мен tote.css-ті төте беттерге автоматты қосу. Әдепкі: `true`.
   * Файлдар `<dist>/_tote-jazu/`-ге көшіріліп, әр төте бетке <link> қосылады.
   */
  injectFont?: boolean;
}

/** Төте беттерге қосылатын стиль файлының URL жолы */
export const TOTE_ASSETS_DIR = '/_tote-jazu';
const TOTE_CSS_HREF = TOTE_ASSETS_DIR + '/css/tote.css';

export interface MirrorLogger {
  info(msg: string): void;
}

const TOTE_ASSETS_DIR_PREFIX = '/_tote-jazu/';

const DEFAULT_SKIP_HREF_PREFIXES = [
  '/_astro/', '/pagefind/', '/fonts/', TOTE_ASSETS_DIR_PREFIX,
  'mailto:', 'tel:', 'http://', 'https://', '//', '#',
  '/sitemap', '/favicon', '/robots.txt', '/CNAME', '/google',
  'data:', 'javascript:',
];

// Статикалық ресурстар (сурет, аудио, стиль, скрипт...) — префикссіз қалады
const ASSET_EXT_RE = /\.(css|js|mjs|json|txt|png|jpe?g|gif|webp|avif|svg|ico|mp3|mp4|webm|ogg|wav|pdf|zip|woff2?|ttf|otf|eot)(\?.*)?$/i;

// Аударылмайтын элементтер: data-tote-skip немесе data-i18n="lang-switch"
const SKIP_ELEMENT_RE =
  /<([a-z][a-z0-9]*)([^>]*(?:data-tote-skip|data-i18n=["']lang-switch["'])[^>]*)>[\s\S]*?<\/\1>/gi;

interface ResolvedOptions {
  site: string;
  prefix: string;
  skipHrefPrefixes: string[];
  rssFiles: string[];
  sitemapFiles: string[];
  addHreflangToOriginal: boolean;
  injectFont: boolean;
}

function resolveOptions(opts: ToteMirrorOptions): ResolvedOptions {
  if (!opts.site) throw new Error('tote-jazu: `site` опциясы міндетті');
  const prefix = '/' + (opts.prefix ?? '/tote').replace(/^\/+|\/+$/g, '');
  return {
    site: opts.site.replace(/\/+$/, ''),
    prefix,
    skipHrefPrefixes: [...DEFAULT_SKIP_HREF_PREFIXES, ...(opts.skipHrefPrefixes ?? [])],
    rssFiles: opts.rssFiles ?? [],
    sitemapFiles: opts.sitemapFiles ?? ['sitemap-0.xml'],
    addHreflangToOriginal: opts.addHreflangToOriginal ?? true,
    injectFont: opts.injectFont ?? true,
  };
}

function shouldRewriteHref(href: string, o: ResolvedOptions): boolean {
  if (!href || !href.startsWith('/')) return false;
  if (href === o.prefix || href.startsWith(o.prefix + '/')) return false;
  for (const p of o.skipHrefPrefixes) if (href.startsWith(p)) return false;
  if (ASSET_EXT_RE.test(href)) return false;
  return true;
}

function rewriteHref(href: string, o: ResolvedOptions): string {
  if (href === '/') return o.prefix + '/';
  return o.prefix + href;
}

/** `/poems/x.html` → `/poems/x`, `/index.html` → `` */
function cleanPath(relPath: string): string {
  return relPath.replace(/\.html$/, '').replace(/\/index$/, '');
}

function urlsFor(relPath: string, o: ResolvedOptions) {
  const p = cleanPath(relPath);
  return {
    origUrl: o.site + p,
    toteUrl: o.site + o.prefix + p,
  };
}

function hreflangLinks(origUrl: string, toteUrl: string): string {
  return (
    `<link rel="alternate" hreflang="kk" href="${origUrl}">` +
    `<link rel="alternate" hreflang="kk-Arab" href="${toteUrl}">`
  );
}

/**
 * Бір HTML бетті төте нұсқаға айналдырады.
 * @param relPath build папкасына қатысты жол, `/`-пен басталады (мысалы `/poems/x.html`)
 */
export function transformHtmlToTote(html: string, relPath: string, opts: ToteMirrorOptions): string {
  const o = resolveOptions(opts);

  const placeholders: string[] = [];
  const pre = html.replace(SKIP_ELEMENT_RE, (m) => {
    placeholders.push(m);
    return `__TOTE_SKIP_${placeholders.length - 1}__`;
  });

  let out = cyrl2toteHtml(pre);
  out = out.replace(/__TOTE_SKIP_(\d+)__/g, (_, idx) => placeholders[Number(idx)] || '');

  out = out.replace(/<html(\s[^>]*)?>/i, (_m, attrs = '') => {
    let a = attrs || '';
    if (!/\bdir\s*=/.test(a)) a += ' dir="rtl"';
    if (!/\blang\s*=/.test(a)) a += ' lang="kk"';
    return `<html${a}>`;
  });

  out = out.replace(/<body(\s[^>]*)?>/i, (_m, attrs = '') => {
    let a = attrs || '';
    if (/\bclass\s*=\s*["']/.test(a)) {
      a = a.replace(/\bclass\s*=\s*(["'])([^"']*)\1/, (_x: string, q: string, v: string) =>
        `class=${q}tote ${v}${q}`,
      );
    } else {
      a += ' class="tote"';
    }
    return `<body${a}>`;
  });

  const { origUrl, toteUrl } = urlsFor(relPath, o);
  out = out.replace(
    /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi,
    `<link rel="canonical" href="${toteUrl}">`,
  );

  if (!out.includes('hreflang="kk-Arab"')) {
    out = out.replace(/<\/head>/i, hreflangLinks(origUrl, toteUrl) + '</head>');
  }

  // KazNet қарпі: tote.css-ті <head> соңына (сайт стильдерінен кейін) қосу
  if (o.injectFont && !out.includes(TOTE_CSS_HREF)) {
    out = out.replace(
      /<\/head>/i,
      `<link rel="preload" href="${TOTE_ASSETS_DIR}/fonts/KazNet.woff2" as="font" type="font/woff2" crossorigin>` +
        `<link rel="stylesheet" href="${TOTE_CSS_HREF}"></head>`,
    );
  }

  out = out.replace(/\b(href|src|action)\s*=\s*(["'])([^"']*)\2/gi, (m, attr, q, val) =>
    shouldRewriteHref(val, o) ? `${attr}=${q}${rewriteHref(val, o)}${q}` : m,
  );

  return out;
}

/** Кирилл бетке hreflang жұбын қосады (бар болса — өзгеріссіз). */
export function addHreflangToOriginal(html: string, relPath: string, opts: ToteMirrorOptions): string {
  if (html.includes('hreflang="kk-Arab"')) return html;
  const o = resolveOptions(opts);
  const { origUrl, toteUrl } = urlsFor(relPath, o);
  return html.replace(/<\/head>/i, hreflangLinks(origUrl, toteUrl) + '</head>');
}

/** RSS: title/description аударылады, link-тер /tote/-ге ауысады. */
export function transformRssToTote(xml: string, opts: ToteMirrorOptions): string {
  const o = resolveOptions(opts);
  return xml
    .replace(/<title>([^<]*)<\/title>/g, (_, t) => `<title>${cyrl2tote(t)}</title>`)
    .replace(/<description>([\s\S]*?)<\/description>/g, (_, t) => `<description>${cyrl2tote(t)}</description>`)
    .replace(/<link>([^<]*)<\/link>/g, (_, t) => `<link>${t.replace(o.site + '/', o.site + o.prefix + '/')}</link>`);
}

/** Sitemap-ке әр URL-дің /tote/ нұсқасын қосады. */
export function addToteUrlsToSitemap(xml: string, opts: ToteMirrorOptions): string {
  const o = resolveOptions(opts);
  const toteMarker = o.site + o.prefix + '/';
  if (xml.includes(toteMarker)) return xml;
  const urls: string[] = [];
  xml.replace(/<loc>([^<]+)<\/loc>/g, (m, loc) => {
    urls.push(loc);
    return m;
  });
  const toteUrls = urls
    .map((u) => (u === o.site ? o.site + o.prefix : u.replace(o.site + '/', toteMarker)))
    .filter((u) => u.startsWith(o.site + o.prefix))
    .map((u) => `<url><loc>${u}</loc></url>`)
    .join('');
  return toteUrls ? xml.replace('</urlset>', toteUrls + '</urlset>') : xml;
}

async function walkHtml(dir: string, base: string, skipTop: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(base, full);
    if (rel.split(path.sep)[0] === skipTop) continue;
    if (ent.isDirectory()) await walkHtml(full, base, skipTop, out);
    else if (ent.isFile() && ent.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** css/tote.css + fonts/KazNet.* → <dist>/_tote-jazu/ */
async function copyFontAssets(distPath: string): Promise<void> {
  const pkgRoot = fileURLToPath(new URL('..', import.meta.url));
  const destRoot = path.join(distPath, TOTE_ASSETS_DIR.slice(1));
  for (const rel of ['css/tote.css', 'fonts/KazNet.woff2', 'fonts/KazNet.woff', 'fonts/KazNet.ttf']) {
    const dest = path.join(destRoot, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(path.join(pkgRoot, rel), dest);
  }
}

/**
 * Build папкасын толық өңдейді: әр HTML-дың төте көшірмесін `<dist>/<prefix>/`-ге
 * жазады, RSS пен sitemap-ті жаңартады. Қайтарады: өңделген HTML саны.
 */
export async function mirrorDirectory(
  distPath: string,
  opts: ToteMirrorOptions,
  logger: MirrorLogger = { info: () => {} },
): Promise<number> {
  const o = resolveOptions(opts);
  const prefixDir = o.prefix.slice(1);
  const toteDir = path.join(distPath, prefixDir);

  if (o.injectFont) await copyFontAssets(distPath);

  const htmlFiles = await walkHtml(distPath, distPath, prefixDir.split('/')[0]);
  logger.info(`tote-jazu: ${htmlFiles.length} HTML файл табылды`);

  for (const src of htmlFiles) {
    const rel = path.relative(distPath, src);
    const relPath = '/' + rel.split(path.sep).join('/');
    const dest = path.join(toteDir, rel);
    const html = await fs.readFile(src, 'utf-8');

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, transformHtmlToTote(html, relPath, opts), 'utf-8');

    if (o.addHreflangToOriginal) {
      const updated = addHreflangToOriginal(html, relPath, opts);
      if (updated !== html) await fs.writeFile(src, updated, 'utf-8');
    }
  }

  for (const rssRel of o.rssFiles) {
    try {
      const xml = await fs.readFile(path.join(distPath, rssRel), 'utf-8');
      const dest = path.join(toteDir, rssRel);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, transformRssToTote(xml, opts), 'utf-8');
    } catch {
      // RSS жоқ — skip
    }
  }

  for (const smRel of o.sitemapFiles) {
    const smPath = path.join(distPath, smRel);
    try {
      const xml = await fs.readFile(smPath, 'utf-8');
      const updated = addToteUrlsToSitemap(xml, opts);
      if (updated !== xml) await fs.writeFile(smPath, updated, 'utf-8');
    } catch {
      // sitemap жоқ — skip
    }
  }

  logger.info(`tote-jazu: дайын. ${o.prefix}/ нұсқасы ${htmlFiles.length} бетпен жасалды.`);
  return htmlFiles.length;
}
