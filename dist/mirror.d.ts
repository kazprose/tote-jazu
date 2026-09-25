/**
 * Фреймворкқа тәуелсіз «төте айна» құралдары.
 *
 * Кез келген статикалық сайттың (Astro, Hugo, Eleventy, Next export, т.б.)
 * build нәтижесіндегі HTML/RSS/sitemap файлдарын алып, `<prefix>/` (әдепкі
 * `/tote/`) астына төте жазулы көшірмесін жасайды.
 *
 *  - <html dir="rtl" lang="kk">
 *  - <body class="tote ...">
 *  - canonical → .../tote/...
 *  - hreflang="kk" / hreflang="kk-Arab" жұбы (екі нұсқаға да)
 *  - Ішкі абсолют сілтемелерге /tote префиксі
 *  - RSS title/description аудару, sitemap-ке /tote/ URL-дерін қосу
 */
export interface ToteMirrorOptions {
    /** Сайттың толық адресі, мысалы `https://ozhaiuly.kz` (соңғы `/`-сыз). */
    site: string;
    /** Төте нұсқаның URL префиксі. Әдепкі: `/tote`. */
    prefix?: string;
    /** Қосымша қайта жазылмайтын href/src префикстері (әдепкілерге қосылады). */
    skipHrefPrefixes?: string[];
    /** Аударылатын RSS файлдары (build папкасына қатысты), мысалы `['poems/rss.xml']`. */
    rssFiles?: string[];
    /** /tote/ URL-дері қосылатын sitemap файлдары. Әдепкі: `['sitemap-0.xml']`. */
    sitemapFiles?: string[];
    /** Кирилл нұсқаға да hreflang қосу керек пе. Әдепкі: `true`. */
    addHreflangToOriginal?: boolean;
}
export interface MirrorLogger {
    info(msg: string): void;
}
/**
 * Бір HTML бетті төте нұсқаға айналдырады.
 * @param relPath build папкасына қатысты жол, `/`-пен басталады (мысалы `/poems/x.html`)
 */
export declare function transformHtmlToTote(html: string, relPath: string, opts: ToteMirrorOptions): string;
/** Кирилл бетке hreflang жұбын қосады (бар болса — өзгеріссіз). */
export declare function addHreflangToOriginal(html: string, relPath: string, opts: ToteMirrorOptions): string;
/** RSS: title/description аударылады, link-тер /tote/-ге ауысады. */
export declare function transformRssToTote(xml: string, opts: ToteMirrorOptions): string;
/** Sitemap-ке әр URL-дің /tote/ нұсқасын қосады. */
export declare function addToteUrlsToSitemap(xml: string, opts: ToteMirrorOptions): string;
/**
 * Build папкасын толық өңдейді: әр HTML-дың төте көшірмесін `<dist>/<prefix>/`-ге
 * жазады, RSS пен sitemap-ті жаңартады. Қайтарады: өңделген HTML саны.
 */
export declare function mirrorDirectory(distPath: string, opts: ToteMirrorOptions, logger?: MirrorLogger): Promise<number>;
