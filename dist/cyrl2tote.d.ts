/**
 * Cyrillic → Tote (Arabic-script Kazakh) converter.
 * Алгоритм портталды: https://github.com/ErbosynNurbol/Cyrl2ToteConverter.CSharp
 *
 * 3 функция:
 *   cyrl2tote(text)         — қарапайым жолды конвертациялау
 *   cyrl2toteHtml(html)     — HTML фрагменттің тек text-node-тарын конвертациялау
 *   cyrl2toteMarkdown(md)   — front-matter + body, code-fence skip
 */
export declare function cyrl2tote(text: string): string;
/**
 * Регекс-табылған тег string ретінде ыңғайсыз болғандықтан,
 * біз тіке state-machine жазамыз.
 *
 * Тек қажетіне жуықтайды: white space-тер, attribute escaping
 * стандартты HTML парсингке сай емес, бірақ Astro генерациялаған
 * HTML үшін жеткілікті.
 */
export declare function cyrl2toteHtml(html: string): string;
export declare function cyrl2toteMarkdown(md: string): string;
