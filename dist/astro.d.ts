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
import { type ToteMirrorOptions } from './mirror.ts';
export type ToteAstroOptions = Partial<ToteMirrorOptions> & {
    /**
     * KazNet қарпі мен tote.css-ті барлық беттерге қосу (`<html dir="rtl">`,
     * `body.tote`, `.tote-text`, `[lang="kk-Arab"]` KazNet-пен көрсетіледі). Әдепкі: `true`.
     */
    font?: boolean;
    /** `/tote/` айнасын жасау. Әдепкі: `true`. Тек қаріп керек болса — `false`. */
    mirror?: boolean;
};
interface MinimalAstroIntegration {
    name: string;
    hooks: {
        'astro:config:setup'?: (params: {
            injectScript: (stage: 'page-ssr', content: string) => void;
        }) => void | Promise<void>;
        'astro:config:done'?: (params: {
            config: {
                site?: string;
            };
        }) => void | Promise<void>;
        'astro:build:done'?: (params: {
            dir: URL;
            logger: {
                info(msg: string): void;
            };
        }) => void | Promise<void>;
    };
}
export default function toteMirror(options?: ToteAstroOptions): MinimalAstroIntegration;
export {};
