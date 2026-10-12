/**
 * Build-time renderer: turns each route into static HTML (scripts/prerender.mjs writes the files),
 * so crawlers and link previews get the full page and head without running JavaScript.
 * In the browser, main.tsx renders the app afresh over this markup.
 */
import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { brand, seo, shareImage, siteUrl, type PageSeo } from './config/site';
import { contactJsonLd, homeJsonLd, servicesJsonLd } from './config/structuredData';

export interface PrerenderPage {
  url: string;
  /** Output file in dist/, served for `url` by .htaccess. */
  file: string;
  seo: PageSeo;
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

export const pages: PrerenderPage[] = [
  { url: '/', file: 'index.html', seo: seo.home, jsonLd: homeJsonLd },
  { url: '/services', file: 'services.html', seo: seo.services, jsonLd: servicesJsonLd },
  { url: '/contact', file: 'contact.html', seo: seo.contact, jsonLd: contactJsonLd },
  { url: '/privacy-policy', file: 'privacy-policy.html', seo: seo.privacy },
  { url: '/terms-and-conditions', file: 'terms-and-conditions.html', seo: seo.terms },
  { url: '/404', file: '404.html', seo: seo.notFound, noindex: true },
];

export const site = { url: siteUrl, name: brand.name, shareImage };

export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  // A Node stream of Buffers at runtime; the project's DOM-only typings don't describe it.
  const decoder = new TextDecoder();
  let html = '';
  for await (const chunk of prelude as unknown as AsyncIterable<Uint8Array | string>) {
    html += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
  }
  return html + decoder.decode();
}
