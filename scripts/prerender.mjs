// Post-build: renders every route to static HTML (dist/<page>.html) from the SSR bundle in dist-ssr/,
// with that page's own title, description, canonical, social tags and JSON-LD in the <head>.
// Crawlers that do not run JavaScript (and Google's first pass) then see the real page.
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';

// React's production server build: smaller markup, no development warnings.
process.env.NODE_ENV ||= 'production';

const dist = new URL('../dist/', import.meta.url);
const ssrEntry = new URL('../dist-ssr/entry-server.js', import.meta.url);

if (!existsSync(ssrEntry)) {
  console.error('[prerender] dist-ssr/entry-server.js not found — run the SSR build first.');
  process.exit(1);
}

const { render, pages, site } = await import(ssrEntry.href);
const template = readFileSync(new URL('index.html', dist), 'utf8');

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// JSON inside <script> must not be able to close the tag.
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

function headFor(page) {
  const url = site.url ? `${site.url}${page.url === '/' ? '/' : page.url}` : '';
  const image = site.url ? `${site.url}${site.shareImage.src}` : '';
  const tags = [
    `<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    !page.noindex && url && `<link rel="canonical" href="${attr(url)}" />`,
    `<meta property="og:site_name" content="${attr(site.name)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    url && !page.noindex && `<meta property="og:url" content="${attr(url)}" />`,
    image && `<meta property="og:image" content="${attr(image)}" />`,
    image && `<meta property="og:image:width" content="${site.shareImage.width}" />`,
    image && `<meta property="og:image:height" content="${site.shareImage.height}" />`,
    image && `<meta property="og:image:alt" content="${attr(site.shareImage.alt)}" />`,
    `<meta name="twitter:title" content="${attr(page.seo.title)}" />`,
    `<meta name="twitter:description" content="${attr(page.seo.description)}" />`,
    image && `<meta name="twitter:image" content="${attr(image)}" />`,
    page.jsonLd && `<script type="application/ld+json" id="page-jsonld">${json(page.jsonLd)}</script>`,
  ];
  return tags.filter(Boolean).map((t) => `    ${t}`).join('\n');
}

function replaceOnce(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`[prerender] template has no ${what}`);
  return html.replace(pattern, replacement);
}

for (const page of pages) {
  const body = await render(page.url);
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${attr(page.seo.title)}</title>`, '<title>');
  html = replaceOnce(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${attr(page.seo.description)}" />`, 'meta description');
  html = replaceOnce(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${attr(page.seo.title)}" />`, 'og:title');
  html = replaceOnce(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${attr(page.seo.description)}" />`, 'og:description');
  html = replaceOnce(html, /<\/head>/, `${headFor(page)}\n  </head>`, '</head>');
  // The hero still frame is only on the home page; don't make other pages download it first.
  if (page.url !== '/') html = html.replace(/\s*<!-- The home hero's still frame[\s\S]*?fetchpriority="high"\s*\/>/, '');
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, 'root element');
  writeFileSync(new URL(page.file, dist), html);
  console.log(`[prerender] ${page.url.padEnd(22)} → dist/${page.file}  (${Math.round(html.length / 1024)} KB)`);
}

rmSync(new URL('../dist-ssr/', import.meta.url), { recursive: true, force: true });
