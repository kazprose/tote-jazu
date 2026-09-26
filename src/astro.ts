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
import { mirrorDirectory, type ToteMirrorOptions } from './mirror.ts';

export type ToteAstroOptions = Partial<ToteMirrorOptions> & {
  /**
   * KazNet қарпі мен tote.css-ті барлық беттерге қосу (`<html dir="rtl">`,
   * `body.tote`, `.tote-text`, `[lang="kk-Arab"]` KazNet-пен көрсетіледі). Әдепкі: `true`.
   */
  font?: boolean;
  /** `/tote/` айнасын жасау. Әдепкі: `true`. Тек қаріп керек болса — `false`. */
  mirror?: boolean;
};

// `astro` пакетіне тәуелді болмау үшін минимал тип
interface MinimalAstroIntegration {
  name: string;
  hooks: {
    'astro:config:setup'?: (params: {
      injectScript: (stage: 'page-ssr', content: string) => void;
    }) => void | Promise<void>;
    'astro:config:done'?: (params: { config: { site?: string } }) => void | Promise<void>;
    'astro:build:done'?: (params: { dir: URL; logger: { info(msg: string): void } }) => void | Promise<void>;
  };
}

export default function toteMirror(options: ToteAstroOptions = {}): MinimalAstroIntegration {
  const { font = true, mirror = true, ...mirrorOptions } = options;
  let site = options.site;
  return {
    name: 'tote-jazu',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        // Vite қаріп файлдарын өзі көшіріп, CSS-ті әр бетке қосады
        if (font) injectScript('page-ssr', `import 'tote-jazu/css/tote.css';`);
      },
      'astro:config:done': ({ config }) => {
        site ??= config.site;
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!mirror) return;
        if (!site) {
          throw new Error('tote-jazu: astro.config-та `site` немесе toteMirror({ site }) көрсетіңіз');
        }
        // Қаріп Vite арқылы бандлға кірген — айна қайта көшірмейді
        await mirrorDirectory(fileURLToPath(dir), { injectFont: !font, ...mirrorOptions, site }, logger);
      },
    },
  };
}
