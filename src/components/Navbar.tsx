import {AnimatePresence, motion} from 'motion/react';
import {Menu, Moon, Sun, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {useTheme} from '../context/ThemeContext';
import {getNewsletterUrl} from '../lib/newsletter';

const BASE_NAV_ITEMS = [
  {label: 'Work', href: '/#work', route: '/work'},
  {label: 'About', href: '/#about', route: '/about'},
  {label: 'Journey', href: '/#journey', route: '/about'},
  {label: 'Books', href: '/#books', route: '/books'},
  {label: 'Credentials', href: '/#credentials', route: '/about'},
  {label: 'Contact', href: '/#contact', route: '/contact'},
];

export function Navbar() {
  const {pathname, navigate} = useRouter();
  const {theme, toggleTheme} = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const newsletterUrl = getNewsletterUrl();
  const navItems = newsletterUrl
    ? [
        ...BASE_NAV_ITEMS.slice(0, 5),
        {label: 'Newsletter', href: '/#newsletter', route: '/#newsletter'},
        BASE_NAV_ITEMS[5],
      ]
    : BASE_NAV_ITEMS;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (y > 140 && y > lastScrollY.current + 6) {
        setHidden(true);
      } else if (y < lastScrollY.current - 6 || y < 80) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof BASE_NAV_ITEMS)[number],
  ) => {
    e.preventDefault();
    setMobileOpen(false);
    if (pathname === '/') {
      navigate(item.href);
    } else if (
      item.href === '/#journey' ||
      item.href === '/#credentials' ||
      item.href === '/#newsletter'
    ) {
      navigate(item.href);
    } else {
      navigate(item.route);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-30 transition-transform duration-300 ease-out ${
          hidden && !mobileOpen ? '-translate-y-full' : 'translate-y-0'
        } ${
          scrolled
            ? 'border-b border-[var(--border)] bg-[#FAFAF8]/85 backdrop-blur-md dark:bg-[#0A0A0A]/85'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-8 px-6">
          {/* Zone 1: Brand mark (single-line wordmark) */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="font-serif-display text-2xl tracking-tight whitespace-nowrap shrink-0 text-[var(--text)] transition-opacity hover:opacity-75"
            aria-label={`${siteContent.profile.name} home`}
          >
            {siteContent.profile.monogram}
          </a>

          {/* Zone 2: Clean single-line navigation links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm text-[var(--muted)]"
          >
            {navItems.map((item) => {
              const isActive =
                pathname !== '/' &&
                !item.route.startsWith('/#') &&
                pathname.startsWith(item.route) &&
                item.route !== '/about';
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`group relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text)] ${
                    isActive ? 'text-[var(--text)] font-medium' : ''
                  }`}
                >
                  {item.label}
                  <span className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-200 group-hover:scale-x-100" />
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Theme toggle + mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 text-xs font-medium text-[var(--text)] whitespace-nowrap shrink-0 transition-colors hover:border-[var(--accent)]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{opacity: 0, y: -16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -16}}
            transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            className="fixed inset-0 z-20 flex flex-col justify-between bg-[#FAFAF8] px-6 pt-24 pb-10 dark:bg-[#0A0A0A] md:hidden"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-5">
              {navItems.map((item, idx) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{opacity: 0, x: -12}}
                  animate={{opacity: 1, x: 0}}
                  transition={{delay: 0.04 * idx, duration: 0.25}}
                  onClick={(e) => handleNavClick(e, item)}
                  className="font-serif-display border-b border-[var(--border)] pb-3 text-4xl text-[var(--text)]"
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.a
                href="/blog"
                initial={{opacity: 0, x: -12}}
                animate={{opacity: 1, x: 0}}
                transition={{delay: 0.28, duration: 0.25}}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  navigate('/blog');
                }}
                className="font-serif-display border-b border-[var(--border)] pb-3 text-4xl text-[var(--text)]"
              >
                Articles
              </motion.a>
            </nav>

            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{siteContent.profile.location}</span>
              <a
                href={`mailto:${siteContent.contact.email}`}
                className="text-[var(--text)] underline underline-offset-4"
              >
                {siteContent.contact.email}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
