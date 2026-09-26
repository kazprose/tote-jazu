/**
 * Astro integration: build аяқталғанда dist/ ішіндегі беттердің төте
 * жазулы айнасын `/tote/` астына жасайды.
 *
 *   // astro.config.mjs
 *   import toteMirror from 'tote-jazu/astro';
 *   export default defineConfig({
 *     site: 'https://example.kz',
 *     integrations: [sitemap(), toteMirror({ rssFiles: ['blog/rss.xml'] })],
 *   });
 */
import { fileURLToPath } from 'node:url';
import { mirrorDirectory } from "./mirror.js";
export default function toteMirror(options = {}) {
    const { font = true, mirror = true, ...mirrorOptions } = options;
    let site = options.site;
    return {
        name: 'tote-jazu',
        hooks: {
            'astro:config:setup': ({ injectScript }) => {
                // Vite қаріп файлдарын өзі көшіріп, CSS-ті әр бетке қосады
                if (font)
                    injectScript('page-ssr', `import 'tote-jazu/css/tote.css';`);
            },
            'astro:config:done': ({ config }) => {
                site ??= config.site;
            },
            'astro:build:done': async ({ dir, logger }) => {
                if (!mirror)
                    return;
                if (!site) {
                    throw new Error('tote-jazu: astro.config-та `site` немесе toteMirror({ site }) көрсетіңіз');
                }
                // Қаріп Vite арқылы бандлға кірген — айна қайта көшірмейді
                await mirrorDirectory(fileURLToPath(dir), { injectFont: !font, ...mirrorOptions, site }, logger);
            },
        },
    };
}
