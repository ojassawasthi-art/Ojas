import Lenis from 'lenis';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
  scrollToSection: (sectionId: string) => void;
  lenis: Lenis | null;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({children}: {children: ReactNode}) {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });
  const lenisRef = useRef<Lenis | null>(null);
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Privacy-friendly page view logger
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const isMobile = window.innerWidth < 768;
    fetch('/api/analytics', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer ? new URL(document.referrer).hostname : '',
        device: isMobile ? 'mobile' : 'desktop',
      }),
    }).catch(() => {});
  }, [pathname]);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, {immediate: true});
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return false;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (lenisRef.current && !prefersReducedMotion) {
      lenisRef.current.scrollTo(target, {offset: -72});
    } else {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
    return true;
  }, []);

  const navigate = useCallback(
    (to: string) => {
      const [rawPath, hash] = to.split('#');
      const targetPath = rawPath || '/';

      if (targetPath !== pathname) {
        window.history.pushState({}, '', to);
        setPathname(targetPath);
        if (hash) {
          setTimeout(() => {
            if (!scrollToSection(hash)) {
              setTimeout(() => scrollToSection(hash), 300);
            }
          }, 80);
        } else {
          scrollToTop();
        }
      } else if (hash) {
        window.history.replaceState({}, '', to);
        scrollToSection(hash);
      } else {
        scrollToTop();
      }
    },
    [pathname, scrollToSection, scrollToTop],
  );

  return (
    <RouterContext.Provider
      value={{
        pathname,
        navigate,
        scrollToSection,
        lenis: lenisInstance,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used inside RouterProvider');
  }
  return ctx;
}
