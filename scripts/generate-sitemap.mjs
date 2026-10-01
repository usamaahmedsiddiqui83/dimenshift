// Post-build: writes dist/robots.txt and, when a site URL is known, dist/sitemap.xml.
// Reads VITE_SITE_URL (or SITE_URL) from the environment of the build process.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const routes = JSON.parse(readFileSync(new URL('../src/config/routes.json', import.meta.url), 'utf8'));
const dist = new URL('../dist/', import.meta.url);
const site = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');

if (!existsSync(dist)) {
  console.error('[sitemap] dist/ not found — run vite build first.');
  process.exit(1);
}

let robots = 'User-agent: *\nAllow: /\n';

if (site) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${site}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join('\n');
  writeFileSync(
    new URL('sitemap.xml', dist),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  robots += `\nSitemap: ${site}/sitemap.xml\n`;
  console.log(`[sitemap] Wrote sitemap.xml for ${routes.length} routes at ${site}`);
} else {
  console.warn('[sitemap] VITE_SITE_URL not set — skipped sitemap.xml; robots.txt has no Sitemap line.');
}

writeFileSync(new URL('robots.txt', dist), robots);
