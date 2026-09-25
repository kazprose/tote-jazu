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
    let site = options.site;
    return {
        name: 'tote-jazu',
        hooks: {
            'astro:config:done': ({ config }) => {
                site ??= config.site;
            },
            'astro:build:done': async ({ dir, logger }) => {
                if (!site) {
                    throw new Error('tote-jazu: astro.config-та `site` немесе toteMirror({ site }) көрсетіңіз');
                }
                await mirrorDirectory(fileURLToPath(dir), { ...options, site }, logger);
            },
        },
    };
}
