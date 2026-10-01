import { Outlet } from 'react-router-dom';
import { Header } from '../navigation/Header';
import { Footer } from './Footer';
import { ScrollManager } from './ScrollManager';

export function SiteLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed top-3 left-3 z-[100] rounded-[2px] bg-brand-500 px-4 py-3 font-medium text-white"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
