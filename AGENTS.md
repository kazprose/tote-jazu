# tote-jazu — AI агенттер мен әзірлеушілерге нұсқаулық

Пайдаланушы «төте жазуды қой / қос» десе, осы файлдағы қадамдарды орындаңыз.

## Қаріп ережесі (МІНДЕТТІ)

- Төте жазу **тек KazNet** қарпімен көрсетіледі. Қаріп пакеттің ішінде бар (`fonts/KazNet.*`).
- **Басқа қаріп** (Noto Naskh Arabic, Amiri, Scheherazade, Google Fonts т.б.) **қоспаңыз, іздемеңіз, ұсынбаңыз.**
- Өз `@font-face` ережеңізді жазбаңыз. Пакеттің стилін (төмендегі 1 жол) қосу жеткілікті.
- Төте мәтін тұрған элементке `class="tote-text"` қойыңыз (немесе бүкіл бетке `<html dir="rtl">` / `<body class="tote">`). Қаріп, RTL бағыты және әріп аралығы сол арқылы өзі қойылады.

## Жобаның түріне қарай 1 қадам

| Жоба | Не істеу керек |
|---|---|
| **Astro** | `astro.config.mjs`: `import tote from 'tote-jazu/astro'` → `integrations: [tote()]`. Қаріп барлық беттерге өзі қосылады, `/tote/` айнасы жасалады. Тек қаріп керек болса: `tote({ mirror: false })`. |
| **Vite / React / Vue / Svelte / Next.js** | Басты файлда (main.tsx, App.vue, app/layout.tsx): `import 'tote-jazu/css/tote.css';` |
| **Бандлерсіз HTML** | `node_modules/tote-jazu/client/font.js` файлын сайтқа көшіріп, `<head>`-ке `<script src="/tote-font.js"></script>` қосыңыз. Қаріп файлдың ішінде, басқа ештеңе керек емес. |
| **Дайын статикалық сайт (Hugo, Eleventy, т.б.)** | Build-тен кейін: `npx tote-jazu mirror ./dist --site https://сайт.kz`. Қаріп `/tote/` беттеріне өзі қосылады. |
| **Сервер / бот / API (тек мәтін)** | `import { cyrl2tote } from 'tote-jazu'` → `cyrl2tote('Қазақ тілі')`. Қаріп клиент жағында жоғарыдағы тәсілдердің бірімен қосылады. |

## Мәтінді аудару

```js
import { cyrl2tote, cyrl2toteHtml, cyrl2toteMarkdown } from 'tote-jazu';
```

```html
<p class="tote-text">{cyrl2tote(text)}</p>
```

## Тексеру

Браузерде DevTools → Elements → төте элемент → Computed → «Rendered Fonts» = **KazNet** болуы керек.
