// Splits the authored article collection (src/lib/blog.js) into one module
// per article plus a lightweight metadata index.
//
// WHY: src/lib/blog.js is ~1 MB of article copy. Bundled as-is it shipped as a
// single ~920 KB chunk that EVERY blog page downloaded — the blog index, all-pages,
// and each of the 85 article pages all shipped all 85 articles to render one.
// Splitting gives each guide its own chunk, so an article page loads one article.
//
// src/lib/blog.js stays the single source of truth for the copy — it is never
// bundled. This script projects it into src/generated/, which is build output
// (gitignored). It runs automatically from vite.config.js before every dev
// server and build, so the projection can never go stale.
//
// Usage: node scripts/gen-article-modules.mjs

import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES } from '../src/lib/blog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'src/generated');
const articlesDir = resolve(outDir, 'articles');

// Wipe stale article modules so a renamed/removed guide cannot linger.
if (existsSync(articlesDir)) rmSync(articlesDir, { recursive: true, force: true });
mkdirSync(articlesDir, { recursive: true });

// Fields the listing pages need (blog index, all-pages).
// Deliberately excludes `blocks` and `faqs` — that is the 1 MB.
const INDEX_FIELDS = [
  'slug',
  'file',
  'title',
  'description',
  'datePublished',
  'dateModified',
  'image',
  'imageAlt',
  'image2',
  'image2Alt',
  'lead',
  'cta',
];

const index = [];

for (const a of ARTICLES) {
  const meta = {};
  for (const f of INDEX_FIELDS) meta[f] = a[f];
  index.push(meta);

  const body =
    '// AUTO-GENERATED from src/lib/blog.js — do not edit.\n' +
    '// Source of truth: src/lib/blog.js. Regenerate with `npm run gen`.\n' +
    `export default ${JSON.stringify(a, null, 2)};\n`;
  writeFileSync(resolve(articlesDir, `${a.slug}.js`), body);
}

// Metadata index for the listing pages (no body copy, no FAQ answers).
const indexFile =
  '// AUTO-GENERATED from src/lib/blog.js — do not edit.\n' +
  '// Listing-page metadata only: title, description, dates, image, lead, CTA.\n' +
  `export const ARTICLE_INDEX = ${JSON.stringify(index, null, 2)};\n` +
  '\n' +
  'export const ARTICLE_BY_FILE = Object.fromEntries(ARTICLE_INDEX.map((a) => [a.file, a]));\n';
writeFileSync(resolve(outDir, 'article-index.js'), indexFile);

const written = readdirSync(articlesDir).filter((f) => f.endsWith('.js')).length;
console.log(
  `gen-article-modules: ${written} article modules + article-index.js (${ARTICLES.length} articles)`
);
