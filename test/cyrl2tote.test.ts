/**
 * Cyrl2Tote қарапайым assertions. Node-та тікелей жүгіреді.
 * Қолдану:
 *   npm test
 * (немесе) node --experimental-strip-types test/cyrl2tote.test.ts
 */

import { cyrl2tote, cyrl2toteHtml, cyrl2toteMarkdown } from '../src/cyrl2tote.ts';

let pass = 0;
let fail = 0;

function eq(actual: string, expected: string, name: string) {
  if (actual === expected) {
    console.log(`✓ ${name}`);
    pass++;
  } else {
    console.error(`✗ ${name}`);
    console.error(`  expected: ${JSON.stringify(expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
    fail++;
  }
}

function contains(haystack: string, needle: string, name: string) {
  if (haystack.includes(needle)) {
    console.log(`✓ ${name}`);
    pass++;
  } else {
    console.error(`✗ ${name}`);
    console.error(`  expected to contain: ${JSON.stringify(needle)}`);
    console.error(`  in:                  ${JSON.stringify(haystack)}`);
    fail++;
  }
}

function notContains(haystack: string, needle: string, name: string) {
  if (!haystack.includes(needle)) {
    console.log(`✓ ${name}`);
    pass++;
  } else {
    console.error(`✗ ${name}`);
    console.error(`  expected NOT to contain: ${JSON.stringify(needle)}`);
    console.error(`  in:                      ${JSON.stringify(haystack)}`);
    fail++;
  }
}

// ============ TEXT ============

eq(cyrl2tote('Қазақ тілі'), 'قازاق ءتىلى', 'Қазақ тілі → قازاق ءتىلى');
eq(cyrl2tote('Алаш'), 'الاش', 'Алаш → الاش (hamza жоқ — қатты дауыс)');
eq(cyrl2tote('қалам'), 'قالام', 'қалам → قالام (hamza жоқ)');
eq(cyrl2tote('Сәлем'), 'سالەم', 'Сәлем → سالەم (ە бар, hamza жоқ)');
eq(cyrl2tote('тіл'), 'ءتىل', 'тіл → ءتىل (hamza)');
eq(cyrl2tote(''), '', 'empty string');
eq(cyrl2tote('   '), '   ', 'whitespace only');

// Тыныс белгілері
contains(cyrl2tote('философия, әдебиет; қалай?'), '،', 'comma → ،');
contains(cyrl2tote('философия, әдебиет; қалай?'), '؛', 'semicolon → ؛');
contains(cyrl2tote('философия, әдебиет; қалай?'), '؟', 'question → ؟');

// "ев" жұрнағы
contains(cyrl2tote('Сәкен Сейфуллин'), 'سەيفۋللين', 'Сейфуллин');
const seifullinev = cyrl2tote('Сәкен Сейфуллинев');
contains(seifullinev, 'يەۆ', 'ev → йев (Сейфуллинев)');

// Артефакттар: "Ықылас Ожайұлы" — крах болмауы керек
const author = cyrl2tote('Ықылас Ожайұлы');
eq(author.includes('Ы') || author.includes('Ы') || /[Ыа-я]/.test(author), false, 'Ықылас Ожайұлы — кирилл әріптер қалмайды');
contains(author, ' ', 'Ықылас Ожайұлы — ұлы бөлек сөз');

// Латын/орыс/ағылшын — сондай қалу керек
contains(cyrl2tote('WhatsApp MP3'), 'WhatsApp', 'Latin words intact');
contains(cyrl2tote('WhatsApp MP3'), 'MP3', 'Numbers intact');

// (қалам/тіл жоғарыда тексерілген)

// ============ HTML ============

eq(
  cyrl2toteHtml('<p class="x">Сәлем</p>'),
  '<p class="x">سالەم</p>',
  'HTML атрибут тиілмейді',
);

eq(
  cyrl2toteHtml('<a href="/poems">Өлеңдер</a>'),
  '<a href="/poems">ولەڭدەر</a>',
  'href тиілмейді',
);

eq(
  cyrl2toteHtml('<script>var x = "Сәлем";</script>'),
  '<script>var x = "Сәлем";</script>',
  '<script> ішкі мәтіні тиілмейді',
);

eq(
  cyrl2toteHtml('<code>Қазақ</code>'),
  '<code>Қазақ</code>',
  '<code> ішкі мәтіні тиілмейді',
);

eq(
  cyrl2toteHtml('<pre>Алаш</pre>'),
  '<pre>Алаш</pre>',
  '<pre> ішкі мәтіні тиілмейді',
);

// Alt атрибуты аударылады
eq(
  cyrl2toteHtml('<img src="/x.jpg" alt="Сәлем">'),
  '<img src="/x.jpg" alt="سالەم">',
  'alt атрибуты аударылады',
);

// HTML entities сақталады
contains(
  cyrl2toteHtml('<p>Сәлем &amp; қош</p>'),
  '&amp;',
  'HTML entity сақталады',
);

// data-* атрибуттары тиілмейді
contains(
  cyrl2toteHtml('<div data-audio="/audio/x.mp3">Сәлем</div>'),
  '/audio/x.mp3',
  'data-audio тиілмейді',
);

// ============ MARKDOWN ============

const md = `---
title: "Алаш"
slug: "alash"
year: 2024
date: "2024-01-15"
audio: "/audio/x.mp3"
youtube_id: "abc123"
collection: "adirna"
---

Олар, сонау қария ғасырда`;

const mdResult = cyrl2toteMarkdown(md);

contains(mdResult, 'title: "الاش"', 'frontmatter title аударылды');
contains(mdResult, 'slug: "alash"', 'frontmatter slug тиілмейді');
contains(mdResult, 'audio: "/audio/x.mp3"', 'frontmatter audio тиілмейді');
contains(mdResult, 'youtube_id: "abc123"', 'frontmatter youtube_id тиілмейді');
contains(mdResult, 'collection: "adirna"', 'frontmatter collection тиілмейді');
contains(mdResult, 'date: "2024-01-15"', 'frontmatter date тиілмейді');
notContains(mdResult, 'Олар, сонау', 'body аударылған (кирилл қалмаған)');

// Code fence сақталу
const mdCode = '# Сәлем\n\n```js\nconst x = "Қазақ";\n```\n\nӘлем';
const mdCodeResult = cyrl2toteMarkdown(mdCode);
contains(mdCodeResult, 'const x = "Қазақ"', 'code fence ішкі мазмұн сақталды');
notContains(mdCodeResult, 'Әлем', 'code fence-тен тыс body аударылған');

// Inline code сақталу
const mdInline = 'Сәлем `қазақ` алаш';
const mdInlineResult = cyrl2toteMarkdown(mdInline);
contains(mdInlineResult, '`қазақ`', 'inline code сақталды');

// ============ SUMMARY ============

console.log('\n' + '='.repeat(40));
console.log(`Тестілер: ${pass} өтті, ${fail} жығылды`);
console.log('='.repeat(40));
if (fail > 0) process.exit(1);
