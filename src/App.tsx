/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {AnimatePresence, motion} from 'motion/react';
import {useCallback, useEffect, useState} from 'react';
import {ChatLauncher} from './components/ChatLauncher';
import {CustomCursor} from './components/CustomCursor';
import {Footer} from './components/Footer';
import {LoadingCurtain} from './components/LoadingCurtain';
import {Navbar} from './components/Navbar';
import {RouterProvider, useRouter} from './context/RouterContext';
import {ThemeProvider} from './context/ThemeContext';
import {usePortfolioData} from './hooks/usePortfolioData';
import {AboutPage} from './pages/AboutPage';
import {AdminPage} from './pages/AdminPage';
import {BlogPage} from './pages/BlogPage';
import {BooksPage} from './pages/BooksPage';
import {ContactPage} from './pages/ContactPage';
import {EducationPage} from './pages/EducationPage';
import {HomePage} from './pages/HomePage';
import {LinksPage} from './pages/LinksPage';
import {NotFoundPage} from './pages/NotFoundPage';
import {PressKitPage} from './pages/PressKitPage';
import {ProjectDetailPage} from './pages/ProjectDetailPage';
import {ServicesPage} from './pages/ServicesPage';
import {WorkPage} from './pages/WorkPage';

function AppShell() {
  const {pathname} = useRouter();
  const {projects, testimonials, settings, loading, refresh} =
    usePortfolioData();
  const [introDone, setIntroDone] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  // Optional GA4 script loader when VITE_GA_MEASUREMENT_ID is configured
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!gaId) return;
    if (document.querySelector(`script[src*="${gaId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.textContent = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`;
    document.head.appendChild(inline);
  }, []);

  const renderPage = () => {
    if (pathname === '/' || pathname === '') {
      return (
        <HomePage
          projects={projects}
          testimonials={testimonials}
          settings={settings}
          loading={loading}
          introDone={introDone}
        />
      );
    }
    if (pathname === '/work') {
      return <WorkPage projects={projects} loading={loading} />;
    }
    if (pathname.startsWith('/work/')) {
      const slug = pathname.replace('/work/', '').replace(/\/$/, '');
      return (
        <ProjectDetailPage
          slug={slug}
          projects={projects}
          loading={loading}
        />
      );
    }
    if (pathname === '/about') {
      return <AboutPage />;
    }
    if (pathname === '/education') {
      return <EducationPage />;
    }
    if (pathname === '/services') {
      return <ServicesPage />;
    }
    if (pathname === '/books') {
      return <BooksPage />;
    }
    if (pathname === '/press-kit') {
      return <PressKitPage />;
    }
    if (pathname === '/links') {
      return <LinksPage />;
    }
    if (pathname === '/contact') {
      return <ContactPage />;
    }
    if (pathname === '/blog') {
      return <BlogPage />;
    }
    if (pathname.startsWith('/blog/')) {
      const slug = pathname.replace('/blog/', '').replace(/\/$/, '');
      return <BlogPage slug={slug} />;
    }
    if (pathname === '/admin') {
      return <AdminPage onDataChanged={refresh} />;
    }
    return <NotFoundPage />;
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="grain-overlay" aria-hidden="true" />
      <CustomCursor />
      <LoadingCurtain onComplete={handleIntroComplete} />
      <Navbar />

      <main id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25, ease: [0.16, 1, 0.3, 1]}}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      {pathname !== '/admin' && <ChatLauncher />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppShell />
      </RouterProvider>
    </ThemeProvider>
  );
}
