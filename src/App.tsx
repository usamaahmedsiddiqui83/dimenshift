import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import HomePage from './pages/HomePage';

const loaders = {
  services: () => import('./pages/ServicesPage'),
  contact: () => import('./pages/ContactPage'),
  privacy: () => import('./pages/PrivacyPolicyPage'),
  terms: () => import('./pages/TermsPage'),
  notFound: () => import('./pages/NotFoundPage'),
};

const ServicesPage = lazy(loaders.services);
const ContactPage = lazy(loaders.contact);
const PrivacyPolicyPage = lazy(loaders.privacy);
const TermsPage = lazy(loaders.terms);
const NotFoundPage = lazy(loaders.notFound);

/**
 * The other pages are small separate chunks. Fetching them once the first page has loaded and the
 * browser is idle makes every later navigation instant, without slowing the first visit.
 */
function usePrefetchPages() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    let idle = 0;
    let timer = 0;
    const prefetch = () => {
      for (const load of Object.values(loaders)) void load().catch(() => undefined);
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(prefetch, { timeout: 4000 });
      else timer = window.setTimeout(prefetch, 1500);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (idle) window.cancelIdleCallback?.(idle);
      clearTimeout(timer);
    };
  }, []);
}

function PageFallback() {
  return <div className="min-h-[100svh]" aria-busy="true" />;
}

export default function App() {
  usePrefetchPages();

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="services"
          element={
            <Suspense fallback={<PageFallback />}>
              <ServicesPage />
            </Suspense>
          }
        />
        <Route
          path="contact"
          element={
            <Suspense fallback={<PageFallback />}>
              <ContactPage />
            </Suspense>
          }
        />
        <Route
          path="privacy-policy"
          element={
            <Suspense fallback={<PageFallback />}>
              <PrivacyPolicyPage />
            </Suspense>
          }
        />
        <Route
          path="terms-and-conditions"
          element={
            <Suspense fallback={<PageFallback />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
