// Injects <link rel="modulepreload"> for each page's own JS chunks.
//
// WHY: every page's component is behind React.lazy, so the browser only
// discovers (and starts downloading) the page chunk AFTER the entry chunk has
// executed. That is a serial round trip on every page. A modulepreload link in
// the head starts the page chunk downloading in parallel with the entry chunk
// and at a higher priority.
//
// Uses Vite's build manifest (build.manifest: true) to map each prerendered
// page to its chunk + that chunk's static imports.
//
// Runs AFTER `vite build` (needs the manifest) and BEFORE `scripts/prerender.mjs`
// (which only rewrites the body, so the injected head links survive).

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const manifestPath = resolve(distDir, '.vite/manifest.json');

if (!existsSync(manifestPath)) {
  console.log('gen-modulepreload: no manifest — skipping.');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// The manifest maps source files to chunks — a build artifact, not site
// content. It is read here and then deleted so it is never published.
rmSync(resolve(distDir, '.vite'), { recursive: true, force: true });

// page type (from the entry shell's data-page) -> source module
const PAGE_MODULE = {
  index: 'src/pages/IndexPage.jsx',
  contact: 'src/pages/ContactPage.jsx',
  'thank-you': 'src/pages/ThankYouPage.jsx',
  residential: 'src/pages/ResidentialPage.jsx',
  partners: 'src/pages/PartnersPage.jsx',
  landing: 'src/pages/BookingPage.jsx',
  ppc: 'src/pages/PpcPage.jsx',
  allpages: 'src/pages/AllPagesPage.jsx',
  about: 'src/pages/AboutPage.jsx',
  blog: 'src/pages/BlogIndexPage.jsx',
  notfound: 'src/pages/NotFoundPage.jsx',
  service: 'src/pages/ServicePage.jsx',
  article: 'src/pages/BlogArticlePage.jsx',
};

function chunksFor(page, file) {
  const keys = [];
  const main = PAGE_MODULE[page];
  if (main) keys.push(main);
  if (page === 'article') {
    const slug = String(file).split('/').pop();
    const art = `src/generated/articles/${slug}.js`;
    if (manifest[art]) keys.push(art);
  }
  return keys;
}

// Collect the chunk files for a key plus its static imports (one level is
// enough — the shared chunks are themselves referenced by the entry).
function collect(key, out) {
  const entry = manifest[key];
  if (!entry) return;
  const file = entry.file;
  if (file && !out.has(file)) out.add(file);
  for (const imp of entry.imports || []) {
    const e = manifest[imp];
    if (e && e.file && !out.has(e.file)) out.add(e.file);
  }
}

function walkFs(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFs(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

let injected = 0;
let skipped = 0;

for (const file of walkFs(distDir)) {
  let html = readFileSync(file, 'utf8');

  const pageMatch = html.match(/data-page="([^"]+)"/);
  const fileMatch = html.match(/data-file="([^"]+)"/);
  if (!pageMatch || !fileMatch) {
    skipped++;
    continue;
  }

  // Chunks already fetched via <script type="module"> must not be preloaded
  // again — the browser dedupes, but a clean head is better.
  const alreadyLoaded = new Set(
    [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"/g)].map((m) => m[1].replace(/^\//, ''))
  );

  const wanted = new Set();
  for (const key of chunksFor(pageMatch[1], fileMatch[1])) collect(key, wanted);

  // The page's own chunk is needed first (it kicks off hydration), so it keeps
  // the default priority. Its static imports are only needed once that chunk
  // runs — preloading them at High priority made them compete with the
  // preloaded webfonts for bandwidth on Slow-4G connections, which delayed
  // the font swap and therefore the LCP text paint. Low priority keeps them
  // early in the queue without slowing the fonts down.
  const pageChunk = wanted.values().next().value;

  const links = [...wanted]
    .filter((f) => !alreadyLoaded.has(f))
    .map(
      (f) =>
        `  <link rel="modulepreload" href="/${f}" crossorigin${
          f === pageChunk ? '' : ' fetchpriority="low"'
        } />`
    )
    .join('\n');

  if (!links) {
    skipped++;
    continue;
  }

  // Insert before the first module script, keeping the document's indentation.
  const anchor = html.match(/([ \t]*)<script type="module"/);
  if (!anchor) {
    skipped++;
    continue;
  }

  html = html.replace(
    anchor[0],
    `${links}\n${anchor[1]}<script type="module"`
  );
  writeFileSync(file, html);
  injected++;
}

console.log(`gen-modulepreload: injected into ${injected} page(s), skipped ${skipped}.`);
