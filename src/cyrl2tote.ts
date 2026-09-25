/**
 * Cyrillic → Tote (Arabic-script Kazakh) converter.
 * Алгоритм портталды: https://github.com/ErbosynNurbol/Cyrl2ToteConverter.CSharp
 *
 * 3 функция:
 *   cyrl2tote(text)         — қарапайым жолды конвертациялау
 *   cyrl2toteHtml(html)     — HTML фрагменттің тек text-node-тарын конвертациялау
 *   cyrl2toteMarkdown(md)   — front-matter + body, code-fence skip
 */

// =============================================================================
// 1. Қазақ кирилл әріптерінің тізімі (case-insensitive) + Copycat-тер
// =============================================================================

const KAZAKH_CYRILLIC = new Set([
  'А','Ә','Ə','Б','В','Г','Ғ','Д','Е','Ё','Ж','З','И','Й','К','Қ','Л','М','Н','Ң',
  'О','Ө','Ɵ','П','Р','С','Т','У','Ұ','Ү','Ф','Х','Һ','Ц','Ч','Ш','Щ','Ъ','Ы','І',
  'Ь','Э','Ю','Я','-',
  'а','ә','ə','б','в','г','ғ','д','е','ё','ж','з','и','й','к','қ','л','м','н','ң',
  'о','ө','ɵ','п','р','с','т','у','ұ','ү','ф','х','һ','ц','ч','ш','щ','ъ','ы','і',
  'ь','э','ю','я',
]);

function isKazakhLetter(ch: string): boolean {
  return KAZAKH_CYRILLIC.has(ch);
}

// =============================================================================
// 2. CopycatCyrlToOriginalCyrl: ұқсас жат таңбаларды нормалау
// =============================================================================

function normalizeCopycats(word: string): string {
  return word
    .replace(/Ə/g, 'Ә')
    .replace(/ə/g, 'ә')
    .replace(/Ɵ/g, 'Ө')
    .replace(/ɵ/g, 'ө');
}

// =============================================================================
// 3. Lookahead қос-әріп ережелері (тек lowercase сай келсе ауыстырылады)
// =============================================================================

const PAIR_MAP: Record<string, string> = {
  'ия': 'يا',
  'йя': 'ييا',
  'ию': 'يۋ',
  'йю': 'يۋ',
  'сц': 'س',
  'тч': 'چ',
  'ий': 'ي',
  // 'хх' өзгеріссіз қалдырамыз (C# мінезі)
};

// =============================================================================
// 4. Бір әріптік сәйкестік кестесі
// =============================================================================

const LETTER_MAP: Record<string, string> = {
  'а': 'ا',
  'ә': 'ءا',
  'б': 'ب',
  'в': 'ۆ',
  'г': 'گ',
  'ғ': 'ع',
  'д': 'د',
  'е': 'ە',
  'ё': 'ءو',
  'ж': 'ج',
  'з': 'ز',
  'и': 'ي',
  'й': 'ي',
  'к': 'ك',
  'қ': 'ق',
  'л': 'ل',
  'м': 'م',
  'н': 'ن',
  'ң': 'ڭ',
  'о': 'و',
  'ө': 'ءو',
  'п': 'پ',
  'р': 'ر',
  'с': 'س',
  'т': 'ت',
  'у': 'ۋ',
  'ұ': 'ۇ',
  'ү': 'ءۇ',
  'ф': 'ف',
  'х': 'ح',
  'һ': 'ھ',
  'ц': 'س',
  'ч': 'چ',
  'ш': 'ش',
  'щ': 'شش',
  'ъ': '',
  'ы': 'ى',
  'і': 'ءى',
  'ь': '',
  'э': 'ە',
  'ю': 'يۋ',   // prevSound әрқашан Unknown → else бұтағы
  'я': 'يا',   // prevSound әрқашан Unknown → else бұтағы
  '¬': '',
  '-': '-',
};

// =============================================================================
// 5. Диалект сөздері (word.lower() толық сай келсе ауыстыру)
// =============================================================================

const DIALECT_WORDS: Record<string, string> = {
  'қр':       'ق ر',
  'жхр':      'ج ح ر',
  'жшс':      'ج ش س',
  'шұар':     'ش ۇ ا ر',
  'бақ':      'ب ا ق',
  'әбаспасөз': 'باسپا ءسوز',
  'қытай':    'جۇڭگو',
};

// =============================================================================
// Сөзді конвертациялау
// =============================================================================

function convertWord(rawWord: string): string {
  if (!rawWord) return '';

  const word = normalizeCopycats(rawWord);
  const lower = word.toLowerCase();

  // Диалект сөзі
  if (DIALECT_WORDS[lower]) return DIALECT_WORDS[lower];

  // Әріп-әріп өңдеу
  let result = '';
  let i = 0;
  while (i < word.length) {
    // Lookahead pair
    if (i + 1 < word.length) {
      const pairLower = (word[i] + word[i + 1]).toLowerCase();
      if (PAIR_MAP[pairLower] !== undefined) {
        result += PAIR_MAP[pairLower];
        i += 2;
        continue;
      }
    }

    const chLower = word[i].toLowerCase();
    if (chLower === '-') {
      result += '-';
    } else if (LETTER_MAP[chLower] !== undefined) {
      result += LETTER_MAP[chLower];
    } else {
      // Қазақ кирилліне кірмейтін кез келген таңба — өзгеріссіз (қорғаныс)
      result += word[i];
    }
    i++;
  }

  // 6. Hamza (ء) ережесі:
  //    - Сөзде ء бар болса (мысалы ә, ө, ү, і, ё әріптерінен) → барлық ء-ні алып,
  //      егер сөзде ك, گ, ە жоқ болса — бір ғана ء сөздің басына қою.
  //    - Сөзде ء жоқ болса (тек қатты дауыс) → hamza қосылмайды.
  const hadHamza = result.includes('ء');
  const hasSoft = result.includes('ك') || result.includes('گ') || result.includes('ە');
  const cleaned = result.replace(/ء/g, '');
  if (hadHamza && !hasSoft) {
    return 'ء' + cleaned;
  }
  return cleaned;
}

// =============================================================================
// 7. Тыныс белгілерін ауыстыру
// =============================================================================

function convertPunct(ch: string): string {
  if (ch === ',') return '،';
  if (ch === '?') return '؟';
  if (ch === ';') return '؛';
  return ch;
}

// =============================================================================
// 8 + 10. Regex post-processing: -ұлы / -қызы бөлу, -ев → -ев
// =============================================================================

function postProcess(text: string): string {
  return text
    // -ұлы → бос орынмен
    .replace(/(\S)ۇلىنىڭ/g, '$1 ۇلىنىڭ')
    .replace(/(\S)ۇلى/g, '$1 ۇلى')
    // -қызы → бос орынмен
    .replace(/(\S)قىزىنىڭ/g, '$1 قىزىنىڭ')
    .replace(/(\S)قىزى/g, '$1 قىزى')
    // -ев → -иев (сөз соңында)
    .replace(/([؀-ۿ])ەۆ(?=\s|$|[،؛؟.!,?\)\]])/g, '$1يەۆ');
}

// =============================================================================
// Public API #1: cyrl2tote(text)
// =============================================================================

export function cyrl2tote(text: string): string {
  if (!text) return text;

  let out = '';
  let buffer = '';

  // C# алгоритмі — мәтіннің соңында жасанды "." қойып, цикл сонымен бітеді.
  // Біз шеткі сөзді шығару үшін сондай жасаймыз.
  const input = text + ''; // sentinel — қазақ әрпі емес, тыныс белгісі де емес

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (isKazakhLetter(ch) && ch !== '-') {
      buffer += ch;
    } else if (ch === '-') {
      // Дефис: сөздің ішінде болса, сөзге қосылады; жоқ болса өзі.
      // C#-та "-" qazақ tізіміnде, сондықтан сөзге қосылады.
      buffer += ch;
    } else {
      // Бөгде таңба — алдыңғы буфермен бітіреміз
      if (buffer.length > 0) {
        out += convertWord(buffer);
        buffer = '';
      }
      if (ch === '') continue; // sentinel — output-қа кірмейді
      out += convertPunct(ch);
    }
  }

  return postProcess(out);
}

// =============================================================================
// Public API #2: cyrl2toteHtml(html)
// =============================================================================

// Тэг шегі (skip-зона): олардың ішкі мәтіні аударылмайды
const SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'textarea']);

// Аударылатын атрибуттар
const TRANSLATE_ATTRS = new Set([
  'alt', 'title', 'aria-label', 'placeholder',
]);

// <meta name="..." content="..."> үшін: тек анық тұтынушыға көрінетіндер
const META_NAMES_TRANSLATE = new Set([
  'description', 'keywords', 'twitter:title', 'twitter:description',
]);
const META_PROPS_TRANSLATE = new Set([
  'og:title', 'og:description', 'og:site_name',
]);

interface HtmlToken {
  type: 'text' | 'tag' | 'comment' | 'doctype';
  raw: string;
  // text үшін: skip context-та болса конвертация жасалмайды
  parentSkip?: boolean;
  // tag үшін: атрибуттарды ауыстыру керек болса processed нұсқа
  processedRaw?: string;
}

/**
 * Регекс-табылған тег string ретінде ыңғайсыз болғандықтан,
 * біз тіке state-machine жазамыз.
 *
 * Тек қажетіне жуықтайды: white space-тер, attribute escaping
 * стандартты HTML парсингке сай емес, бірақ Astro генерациялаған
 * HTML үшін жеткілікті.
 */
export function cyrl2toteHtml(html: string): string {
  if (!html) return html;

  const tokens: HtmlToken[] = [];
  let i = 0;
  const skipStack: string[] = []; // ағымдағы skip-tag стегі

  while (i < html.length) {
    if (html[i] === '<') {
      // Comment?
      if (html.slice(i, i + 4) === '<!--') {
        const end = html.indexOf('-->', i + 4);
        const stop = end === -1 ? html.length : end + 3;
        tokens.push({ type: 'comment', raw: html.slice(i, stop) });
        i = stop;
        continue;
      }
      // Doctype / CDATA / processing instructions
      if (html[i + 1] === '!') {
        const end = html.indexOf('>', i + 2);
        const stop = end === -1 ? html.length : end + 1;
        tokens.push({ type: 'doctype', raw: html.slice(i, stop) });
        i = stop;
        continue;
      }
      // Tag (open / close / self-close)
      const end = html.indexOf('>', i + 1);
      if (end === -1) {
        // malformed: дегендей-ақ қалдырамыз
        tokens.push({ type: 'text', raw: html.slice(i), parentSkip: skipStack.length > 0 });
        break;
      }
      const tagRaw = html.slice(i, end + 1);
      const tagInfo = parseTagName(tagRaw);
      if (tagInfo.isClosing) {
        if (skipStack.length > 0 && skipStack[skipStack.length - 1] === tagInfo.name) {
          skipStack.pop();
        }
        tokens.push({ type: 'tag', raw: tagRaw });
      } else {
        // Атрибуттарды конвертациялау
        const processedRaw = processOpenTagAttrs(tagRaw, tagInfo.name);
        tokens.push({ type: 'tag', raw: tagRaw, processedRaw });
        if (!tagInfo.isSelfClosing && SKIP_TAGS.has(tagInfo.name)) {
          skipStack.push(tagInfo.name);
        }
      }
      i = end + 1;
    } else {
      // Мәтін
      const next = html.indexOf('<', i);
      const stop = next === -1 ? html.length : next;
      tokens.push({
        type: 'text',
        raw: html.slice(i, stop),
        parentSkip: skipStack.length > 0,
      });
      i = stop;
    }
  }

  return tokens
    .map((t) => {
      if (t.type === 'text') {
        if (t.parentSkip) return t.raw;
        return convertHtmlTextNode(t.raw);
      }
      if (t.type === 'tag' && t.processedRaw) return t.processedRaw;
      return t.raw;
    })
    .join('');
}

function parseTagName(tag: string): { name: string; isClosing: boolean; isSelfClosing: boolean } {
  // <tag attr=...> немесе </tag> немесе <tag/>
  const isClosing = tag.startsWith('</');
  const isSelfClosing = tag.endsWith('/>');
  const inner = tag.replace(/^<\/?|\s.*$|\/?>$/g, '');
  return { name: inner.toLowerCase(), isClosing, isSelfClosing };
}

function processOpenTagAttrs(tagRaw: string, tagName: string): string {
  // <meta name|property="X" content="...">
  if (tagName === 'meta') {
    const nameMatch = tagRaw.match(/\sname\s*=\s*["']([^"']+)["']/i);
    const propMatch = tagRaw.match(/\sproperty\s*=\s*["']([^"']+)["']/i);
    const name = (nameMatch?.[1] || propMatch?.[1] || '').toLowerCase();
    const isTranslatable =
      (nameMatch && META_NAMES_TRANSLATE.has(name)) ||
      (propMatch && META_PROPS_TRANSLATE.has(name));
    if (isTranslatable) {
      return tagRaw.replace(/(\scontent\s*=\s*["'])([^"']*)(["'])/i, (_, p1, val, p3) =>
        p1 + escapeAttr(cyrl2tote(unescapeAttr(val))) + p3
      );
    }
    return tagRaw;
  }

  // Жалпы атрибуттар (alt, title, aria-label, placeholder)
  let result = tagRaw;
  for (const attr of TRANSLATE_ATTRS) {
    const re = new RegExp(`(\\s${attr}\\s*=\\s*["'])([^"']*)(["'])`, 'i');
    result = result.replace(re, (_, p1, val, p3) =>
      p1 + escapeAttr(cyrl2tote(unescapeAttr(val))) + p3
    );
  }
  return result;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function unescapeAttr(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

function convertHtmlTextNode(text: string): string {
  // HTML entities-ті сақтап, тек қазақ мәтінін аударамыз
  // Қарапайымдау: entity-лер бөлек tokenize
  const parts = text.split(/(&[a-zA-Z#][a-zA-Z0-9#]{1,8};)/);
  return parts
    .map((p) => {
      if (p.startsWith('&') && p.endsWith(';')) return p;
      return cyrl2tote(p);
    })
    .join('');
}

// =============================================================================
// Public API #3: cyrl2toteMarkdown(md)
// =============================================================================

// Front-matter ішінде аударылмайтын өрістер
const FM_SKIP_FIELDS = new Set([
  'slug', 'image', 'hero_image', 'audio', 'url', 'date', 'year',
  'youtube_id', 'read_time', 'tag', 'category', 'collection',
  'meta_image', 'og_image',
]);
// Front-matter ішінде аударылатын өрістер
const FM_TRANSLATE_FIELDS = new Set([
  'title', 'description', 'meta_desc', 'excerpt', 'subtitle',
  'author', 'keywords',
]);

export function cyrl2toteMarkdown(md: string): string {
  if (!md) return md;

  // Front-matter табу
  const fmMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  let body = md;
  let fmConverted = '';

  if (fmMatch) {
    const fmText = fmMatch[1];
    const lines = fmText.split('\n');
    const converted = lines.map((line) => {
      const m = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
      if (!m) return line;
      const [, indent, key, rest] = m;
      const keyLower = key.toLowerCase();
      if (FM_TRANSLATE_FIELDS.has(keyLower) && !FM_SKIP_FIELDS.has(keyLower)) {
        // String value-ды квоттан босатып аударып, қайта қою
        const trimmed = rest.trim();
        let value = trimmed;
        let quote = '';
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          quote = trimmed[0];
          value = trimmed.slice(1, -1);
        }
        const tote = cyrl2tote(value);
        // Quote-ы бар болса сақтайық, әйтпесе double-quote қойайық (қауіпсіздік үшін)
        const newQuote = quote || '"';
        return `${indent}${key}: ${newQuote}${tote.replace(new RegExp(newQuote, 'g'), '\\' + newQuote)}${newQuote}`;
      }
      return line;
    });
    fmConverted = `---\n${converted.join('\n')}\n---\n`;
    body = md.slice(fmMatch[0].length);
  }

  // Body — code-fence пен inline-code сақтап аудару
  const bodyConverted = convertMarkdownBody(body);
  return fmConverted + bodyConverted;
}

function convertMarkdownBody(md: string): string {
  // Code fence (``` ... ```) tokenize
  const parts = md.split(/(```[\s\S]*?```|`[^`\n]*`)/);
  return parts
    .map((p) => {
      if (p.startsWith('```') || (p.startsWith('`') && p.endsWith('`'))) {
        return p; // code сақталады
      }
      return cyrl2tote(p);
    })
    .join('');
}
