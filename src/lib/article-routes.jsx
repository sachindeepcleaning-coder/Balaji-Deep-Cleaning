// Per-article route map.
//
// Each guide gets its OWN chunk. src/lib/blog.js (the authored source, ~1 MB)
// is never bundled — vite.config.js projects it into src/generated/articles/
// before every build, and the glob below turns each of those files into its
// own lazily-loaded chunk.
//
// Without this, one shared ~920 KB chunk carried all 85 articles to every
// blog page. With it, an article page ships one article + the shared view.
//
// The article module and the shared page view are requested in PARALLEL and
// resolved together, so there is no nested Suspense boundary during
// hydration — the component only renders once both are in memory.

import { lazy } from 'react';

const modules = import.meta.glob('../generated/articles/*.js');

// One lazy component per article, created once and cached.
const cache = new Map();

export function getArticleRoute(file) {
  if (cache.has(file)) return cache.get(file);

  const slug = String(file).split('/').pop();
  const key = `../generated/articles/${slug}.js`;
  const load = modules[key];

  if (!load) {
    cache.set(file, null);
    return null;
  }

  const Comp = lazy(() =>
    Promise.all([load(), import('../pages/BlogArticlePage.jsx')]).then(([mod, view]) => ({
      default: (props) => {
        const Article = view.default;
        return <Article {...props} article={mod.default} />;
      },
    }))
  );

  cache.set(file, Comp);
  return Comp;
}
