import { useEffect } from 'react';
import { brand, shareImage, siteUrl, type PageSeo } from '../config/site';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Applies per-route title, description, canonical, Open Graph and optional JSON-LD. */
export function useSeo(page: PageSeo, jsonLd?: Record<string, unknown>, noindex = false) {
  useEffect(() => {
    document.title = page.title;
    setMeta('name', 'description', page.description);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow');
    setMeta('property', 'og:title', page.title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:site_name', brand.name);
    setMeta('name', 'twitter:title', page.title);
    setMeta('name', 'twitter:description', page.description);
    if (siteUrl) {
      setMeta('property', 'og:image', `${siteUrl}${shareImage.src}`);
      setMeta('name', 'twitter:image', `${siteUrl}${shareImage.src}`);
    }
    const url = siteUrl ? `${siteUrl}${page.path === '/' ? '/' : page.path}` : null;
    setCanonical(noindex ? null : url);
    if (url) setMeta('property', 'og:url', url);

    const id = 'page-jsonld';
    document.getElementById(id)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [page, jsonLd, noindex]);
}
