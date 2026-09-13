'use client';

import {
  colorVars,
  fontWeightVars,
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isNavLinkActive } from '../api/nav.js';
import { useScrollShadow } from '../hooks/use-scroll-shadow.js';
import { IconClose } from './icon/icon-close.jsx';
import { IconHamburger } from './icon/icon-hamburger.jsx';

/** @typedef {import('../types/index.js').NavLink} NavLink */

const styles = stylex.create({
  nav: {
    alignItems: 'center',
    backdropFilter: 'blur(16px) saturate(200%)',
    backgroundColor: `color-mix(in srgb, ${colorVars['--color-background-surface']} 90%, transparent)`,
    display: 'flex',
    fontFamily: 'var(--font-family-body)',
    height: '64px',
    paddingInlineEnd: {
      default: '6px',
      '@media (min-width: 1024px)': '20px',
    },
    paddingInlineStart: {
      default: '6px',
      '@media (min-width: 1024px)': '16px',
    },
    transitionDuration: '300ms',
    transitionProperty: 'box-shadow, background-color',
    width: '100%',
  },
  scrolledNav: {
    boxShadow: `0 1px 4px color-mix(in srgb, ${colorVars['--color-text-primary']} 18%, transparent)`,
  },
  inner: {
    alignItems: 'center',
    display: 'flex',
    gap: {
      default: 0,
      '@media (min-width: 640px)': '12px',
    },
    height: '64px',
    justifyContent: 'space-between',
    width: '100%',
  },
  brandArea: {
    alignItems: 'center',
    display: 'flex',
    flex: {
      default: '0 1 auto',
      '@media (min-width: 1919px)': '1',
    },
    minWidth: 0,
  },
  logoLink: {
    alignItems: 'center',
    borderRadius: radiusVars['--radius-element'],
    display: 'inline-flex',
    flexShrink: 0,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    outlineOffset: spacingVars['--spacing-1'],
    transform: {
      default: 'scale(1)',
      ':active': 'scale(0.95)',
    },
  },
  logo: {
    height: {
      default: '40px',
      '@media (max-width: 639px)': '32px',
    },
    maxWidth: {
      default: null,
      '@media (max-width: 639px)': '7.5rem',
    },
    objectFit: 'contain',
    width: 'auto',
  },
  mobileToggle: {
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colorVars['--color-background-muted'],
      ':active': colorVars['--color-overlay-pressed'],
    },
    borderRadius: radiusVars['--radius-full'],
    borderWidth: 0,
    color: colorVars['--color-icon-primary'],
    cursor: 'pointer',
    display: {
      default: 'none',
      '@media (max-width: 1023px)': 'inline-flex',
    },
    height: '48px',
    justifyContent: 'center',
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    padding: 0,
    transitionDuration: '100ms',
    transitionProperty: 'transform, background-color, color',
    width: '48px',
  },
  openMobileToggle: {
    color: colorVars['--color-text-accent'],
  },
  mobileToggleIcon: {
    display: 'block',
    height: '24px',
    width: '24px',
  },
  primaryList: {
    alignItems: 'center',
    display: {
      default: 'flex',
      '@media (max-width: 1023px)': 'none',
    },
    gap: '6px',
    justifyContent: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  primaryItem: {
    margin: 0,
    padding: 0,
  },
  primaryLink: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colorVars['--color-background-muted'],
    },
    borderRadius: radiusVars['--radius-full'],
    color: colorVars['--color-text-primary'],
    display: 'inline-flex',
    fontSize: '0.9375rem',
    fontWeight: fontWeightVars['--font-weight-normal'],
    lineHeight: '30px',
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    paddingBlock: spacingVars['--spacing-1-5'],
    paddingInline: spacingVars['--spacing-4'],
    textDecoration: 'none',
    transform: {
      default: 'scale(1)',
      ':active': 'scale(0.95)',
    },
  },
  selectedPrimaryLink: {
    backgroundColor: {
      default: colorVars['--color-accent-muted'],
      ':hover': colorVars['--color-accent-muted'],
    },
    color: colorVars['--color-text-accent'],
    fontWeight: fontWeightVars['--font-weight-medium'],
  },
  endArea: {
    alignItems: 'center',
    display: 'flex',
    flex: {
      default: '0 0 auto',
      '@media (min-width: 1919px)': '1',
    },
    gap: '6px',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
});

/** @param {{ isOpen: boolean }} props */
function MobileMenuIcon({ isOpen }) {
  const Icon = isOpen ? IconClose : IconHamburger;
  return <Icon aria-hidden="true" {...stylex.props(styles.mobileToggleIcon)} />;
}

/**
 * React Docs-inspired top navigation implemented directly with semantic
 * markup and StyleX rather than Astryx TopNav components.
 * @param {{
 *   siteName: string,
 *   navLinks: NavLink[],
 *   endContent?: import('react').ReactNode,
 *   hasSideNav?: boolean,
 *   isMobileNavOpen: boolean,
 *   mobileToggleRef: import('react').RefObject<HTMLButtonElement | null>,
 *   onMobileNavToggle: () => void,
 * }} props
 */
export function Header({
  siteName,
  navLinks,
  endContent,
  hasSideNav = false,
  isMobileNavOpen,
  mobileToggleRef,
  onMobileNavToggle,
}) {
  const pathname = usePathname();
  const isScrolled = useScrollShadow();

  return (
    <nav
      aria-label="Điều hướng chính"
      {...stylex.props(styles.nav, isScrolled && styles.scrolledNav)}
    >
      <div {...stylex.props(styles.inner)}>
        <div {...stylex.props(styles.brandArea)}>
          {hasSideNav ? (
            <button
              ref={mobileToggleRef}
              type="button"
              aria-label={isMobileNavOpen ? 'Đóng menu' : 'Mở menu'}
              aria-controls="mobile-docs-navigation"
              aria-expanded={isMobileNavOpen}
              onClick={onMobileNavToggle}
              {...stylex.props(
                styles.mobileToggle,
                isMobileNavOpen && styles.openMobileToggle,
              )}
            >
              <MobileMenuIcon isOpen={isMobileNavOpen} />
            </button>
          ) : null}
          <Link
            href="/"
            aria-label={siteName}
            {...stylex.props(styles.logoLink)}
          >
            <Image
              src="/images/logo-dn-group.png"
              alt={siteName}
              width={132}
              height={38}
              priority
              {...stylex.props(styles.logo)}
            />
          </Link>
        </div>

        <div {...stylex.props(styles.endArea)}>
          <ul {...stylex.props(styles.primaryList)}>
            {navLinks.map((link) => {
              const isSelected = isNavLinkActive(pathname, link.href);

              return (
                <li key={link.href} {...stylex.props(styles.primaryItem)}>
                  <Link
                    href={link.href}
                    aria-current={isSelected ? 'page' : undefined}
                    {...stylex.props(
                      styles.primaryLink,
                      isSelected && styles.selectedPrimaryLink,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {endContent}
        </div>
      </div>
    </nav>
  );
}
