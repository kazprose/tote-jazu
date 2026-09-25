#!/usr/bin/env node
/**
 * tote-jazu CLI
 *
 *   echo "Қазақ тілі" | npx tote-jazu            # мәтін
 *   npx tote-jazu --html < page.html > tote.html   # HTML
 *   npx tote-jazu --md < post.md > tote.md         # Markdown
 *   npx tote-jazu mirror ./dist --site https://example.kz [--prefix /tote] [--rss blog/rss.xml]
 */

import { cyrl2tote, cyrl2toteHtml, cyrl2toteMarkdown } from './cyrl2tote.ts';
import { mirrorDirectory } from './mirror.ts';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'mirror') {
    const dir = args[1];
    const site = argValue(args, '--site');
    if (!dir || !site) {
      console.error('Қолдану: tote-jazu mirror <dist-dir> --site https://example.kz [--prefix /tote] [--rss a.xml]...');
      process.exit(2);
    }
    const rssFiles = args.flatMap((a, i) => (a === '--rss' && args[i + 1] ? [args[i + 1]] : []));
    await mirrorDirectory(dir, { site, prefix: argValue(args, '--prefix'), rssFiles }, console);
    return;
  }

  const input = await readStdin();
  const out = args.includes('--html')
    ? cyrl2toteHtml(input)
    : args.includes('--md')
      ? cyrl2toteMarkdown(input)
      : cyrl2tote(input);
  process.stdout.write(out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
