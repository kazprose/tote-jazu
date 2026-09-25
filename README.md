# tote-jazu

Кирилл → **төте жазу** (араб графикалы қазақ жазуы) конверторы.
Бұрын [ozhaiuly-site](https://github.com/kazprose/ozhaiuly-site)-тың ішінде болған төте жазу функциясы басқа жобаларда қайта қолдануға болатын жеке пакетке шығарылды.

Ішінде:

| Бөлік | Импорт | Не істейді |
|---|---|---|
| **Конвертор** | `tote-jazu` / `tote-jazu/converter` | `cyrl2tote`, `cyrl2toteHtml`, `cyrl2toteMarkdown` |
| **Сайт айнасы** | `tote-jazu/mirror` | Build папкасындағы HTML/RSS/sitemap-тің `/tote/` нұсқасын жасайды (кез келген SSG үшін) |
| **Astro интеграциясы** | `tote-jazu/astro` | Айнаны `astro build` соңында автоматты іске қосады |
| **CLI** | `npx tote-jazu` | stdin → төте; `mirror` командасы |
| **Тіл ауыстырғыш** | `tote-jazu/client/lang-switch.js` | Кирилл ⇄ Төте батырмасы (браузер) |
| **CSS + қаріп** | `tote-jazu/css/tote.css`, `tote-jazu/fonts/*` | KazNet қарпі, RTL базалық стиль |

Алгоритм [ErbosynNurbol/Cyrl2ToteConverter.CSharp](https://github.com/ErbosynNurbol/Cyrl2ToteConverter.CSharp)-тан TypeScript-ке портталған.

## Орнату

Репо private болғандықтан npm-де жоқ, GitHub-тан тікелей орнатылады
(машинада `kazprose/tote-jazu`-ға git қолжетімділігі болуы керек):

```bash
npm install github:kazprose/tote-jazu
# нақты нұсқаға бекіту:
npm install github:kazprose/tote-jazu#v1.0.0
```

`dist/` репоға commit-телген, сондықтан орнатқанда build қажет емес.

## 1. Конвертор

```ts
import { cyrl2tote, cyrl2toteHtml, cyrl2toteMarkdown } from 'tote-jazu';

cyrl2tote('Қазақ тілі');                    // 'قازاق ءتىلى'
cyrl2tote('Ықылас Ожайұлы?');               // 'ىقىلاس وجاي ۇلى؟'
cyrl2toteHtml('<p title="Сәлем">Алаш</p>'); // '<p title="سالەم">الاش</p>'
cyrl2toteMarkdown(md);                      // front-matter title/description + body
```

Конвертор тәуелсіз, браузерде де жұмыс істейді (`tote-jazu/converter`).

### Не аударылады / не аударылмайды

| Аударылады | Аударылмайды |
|---|---|
| HTML мәтіндік нодалары | `<script>`, `<style>`, `<code>`, `<pre>`, `<textarea>` ішкі мазмұны |
| `alt`, `title`, `aria-label`, `placeholder` атрибуттары | `href`, `src`, `data-*`, `id`, `class`, `style` |
| `<meta name="description\|keywords\|twitter:title\|twitter:description">` | `<meta name="author">`, URL-дар |
| `<meta property="og:title\|og:description\|og:site_name">` | |
| Markdown body | Code fence, inline code |
| Front-matter: `title`, `description`, `meta_desc`, `excerpt`, `subtitle`, `author`, `keywords` | `slug`, `image`, `audio`, `url`, `date`, `year`, `youtube_id`, `tag`, `category`, `collection`, ... |

### Алгоритм қысқаша

1. Қазақ кирилл әріптері тізіміне кірмейтін таңба → сөз шегі
2. Қос әріптер: `ия→يا`, `йя→ييا`, `ию→يۋ`, `йю→يۋ`, `сц→س`, `тч→چ`, `ий→ي`
3. Бір әріптік сәйкестік (`а→ا`, `ә→ءا`, `қ→ق`, ...)
4. **Hamza ережесі:** сөзде `ء` болса, бәрі алынып, сөзде `ك`/`گ`/`ە` жоқ болса бір ғана `ء` сөз басына қойылады
5. Тыныс белгілері: `,→،`, `?→؟`, `;→؛`
6. Post-process: `-ұлы`/`-қызы` бөлек сөз, `-ев→-иев`

## 2. Astro жобасына қосу

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import toteMirror from 'tote-jazu/astro';

export default defineConfig({
  site: 'https://example.kz',          // міндетті (немесе toteMirror({ site }))
  integrations: [
    sitemap(),                          // toteMirror-дан БҰРЫН тұрсын
    toteMirror({
      prefix: '/tote',                  // әдепкі
      rssFiles: ['blog/rss.xml'],       // аударылатын RSS-тер
      skipHrefPrefixes: ['/images/', '/api.php'], // префикстелмейтін жолдар
    }),
  ],
});
```

`npm run build` кезінде `dist/` ішіндегі әр бет `dist/tote/`-ге көшіріліп, төте жазуға аударылады:

- `<html dir="rtl" lang="kk">`, `<body class="tote ...">`
- canonical → `https://example.kz/tote/...`
- екі нұсқаға да `hreflang="kk"` / `hreflang="kk-Arab"` жұбы
- ішкі сілтемелер `/tote/`-пен префикстеледі (сыртқы сілтемелер, `#`, `mailto:`, `/_astro/`, суреттер/аудио/стиль файлдары тиілмейді)
- sitemap-ке `/tote/` URL-дері қосылады

### Опциялар

| Опция | Әдепкі | Сипаттама |
|---|---|---|
| `site` | Astro `site` | Сайт адресі |
| `prefix` | `/tote` | Төте нұсқаның URL префиксі |
| `skipHrefPrefixes` | `[]` | Қосымша префикстелмейтін href/src (әдепкілерге қосылады) |
| `rssFiles` | `[]` | Аударылатын RSS файлдары (dist-ке қатысты) |
| `sitemapFiles` | `['sitemap-0.xml']` | `/tote/` URL-дері қосылатын sitemap-тер |
| `addHreflangToOriginal` | `true` | Кирилл беттерге hreflang қосу |

## 3. Басқа статикалық сайттар (Hugo, Eleventy, Next export, қарапайым HTML)

Build-тен кейін CLI арқылы:

```bash
npx tote-jazu mirror ./dist --site https://example.kz --rss blog/rss.xml
```

немесе Node-та:

```js
import { mirrorDirectory } from 'tote-jazu/mirror';
await mirrorDirectory('./public', { site: 'https://example.kz' }, console);
```

Бір бетті ғана өңдеу керек болса: `transformHtmlToTote(html, '/about.html', { site })`.

## 4. Тіл ауыстырғыш батырма

```html
<a href="#" class="lang-switch" data-tote-switch data-tote-skip>Төте</a>
<script type="module">
  import 'tote-jazu/client/lang-switch.js'; // бандлер арқылы
</script>
```

`data-tote-switch` бар элемент ағымдағы беттің қарсы нұсқасына сілтеме болады (`/poems` ⇄ `/tote/poems`).
`data-tote-skip` (немесе ескі `data-i18n="lang-switch"`) — айна бұл элементтің мәтінін аудармайды.

Параметрлермен: `initLangSwitch({ selector: '#langSwitch', prefix: '/tote', toteLabel: 'Төте', cyrlLabel: 'Кирилл' })`.

## 5. CSS және қаріп

```js
import 'tote-jazu/css/tote.css'; // Vite/Astro қаріп файлдарын өзі көшіреді
```

Бандлер жоқ болса, `css/` және `fonts/` папкаларын жанына көшіріп `<link rel="stylesheet" href="/css/tote.css">` қосыңыз.

`tote.css` береді: `@font-face KazNet`, `html[dir="rtl"] body` үшін RTL + қаріп, `letter-spacing: 0` (араб жазуы әріп аралығына шыдамайды),
`.tote-ltr` (сан/латын мәтін үшін) және `.tote-text` (бет RTL болмаса, жеке блокты төте етіп көрсету).
Қаріпті `--tote-font` айнымалысы арқылы ауыстыруға болады.

## Демо

`demo/index.html` — KazNet қарпімен тірі конвертор (кирилл жазсаңыз, төтеге бірден аударады):

```bash
npm run build && python3 -m http.server 8000   # → http://localhost:8000/demo/
```

## CLI

```bash
echo "Қазақ тілі" | npx tote-jazu          # قازاق ءتىلى
npx tote-jazu --html < page.html > out.html
npx tote-jazu --md   < post.md   > out.md
npx tote-jazu mirror ./dist --site https://example.kz [--prefix /tote] [--rss a.xml]
```

## Даму

```bash
npm install
npm test        # 34 конвертор + mirror тестілері (Node ≥ 22.6, --experimental-strip-types)
npm run build   # src/ → dist/  (dist/ commit-телуі керек)
```
