/**
 * Кирилл ⇄ Төте ауыстырғыш (браузер).
 *
 * Автоматты: `data-tote-switch` атрибуты бар кез келген <a> элементі
 * ағымдағы беттің қарсы нұсқасына сілтеме болады.
 *
 *   <a href="#" data-tote-switch data-tote-skip>Төте</a>
 *   <script src="/tote-lang-switch.js"></script>
 *
 * Немесе ESM:
 *   import { initLangSwitch } from 'tote-jazu/client/lang-switch.js';
 *   initLangSwitch({ selector: '#langSwitch' });
 *
 * `data-tote-skip` — tote-jazu айнасы бұл элементтің мәтінін аудармайды.
 */

export function toggleTotePath(pathname, prefix = '/tote') {
  const isTote = pathname === prefix || pathname.indexOf(prefix + '/') === 0;
  if (isTote) return pathname.slice(prefix.length) || '/';
  return prefix + (pathname === '/' ? '/' : pathname);
}

export function initLangSwitch(opts = {}) {
  const {
    selector = '[data-tote-switch]',
    prefix = '/tote',
    toteLabel = 'Төте',
    toteTitle = 'Төте жазуға өту',
    cyrlLabel = 'Кирилл',
    cyrlTitle = 'Кирилл жазуға өту',
  } = opts;
  const pathname = window.location.pathname;
  const isTote = pathname === prefix || pathname.indexOf(prefix + '/') === 0;
  const href = toggleTotePath(pathname, prefix) + window.location.search + window.location.hash;
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = isTote ? cyrlLabel : toteLabel;
    el.title = isTote ? cyrlTitle : toteTitle;
    el.setAttribute('href', href);
  });
}

if (typeof document !== 'undefined' && document.querySelector('[data-tote-switch]')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLangSwitch());
  } else {
    initLangSwitch();
  }
}
