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

export type ToteAstroOptions = Partial<ToteMirrorOptions>;

// `astro` пакетіне тәуелді болмау үшін минимал тип
interface MinimalAstroIntegration {
  name: string;
  hooks: {
    'astro:config:done'?: (params: { config: { site?: string } }) => void | Promise<void>;
    'astro:build:done'?: (params: { dir: URL; logger: { info(msg: string): void } }) => void | Promise<void>;
  };
}

export default function toteMirror(options: ToteAstroOptions = {}): MinimalAstroIntegration {
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
