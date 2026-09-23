'use client';

import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

import { appShellContentStyle } from './protected-app-shell.jsx';

// `ProtectedAppShell`'s sticky header sits at z-index 40 (see
// `protected-app-shell.jsx`) — comfortably above that so the overlay
// covers it, per the user's request that maximizing hides both the top
// nav and the side nav, not just grows within the content column.
const FULLSCREEN_Z_INDEX = 500;

const styles = stylex.create({
  overlay: {
    inset: 0,
    overflowY: 'auto',
    padding: spacingVars['--spacing-6'],
    position: 'fixed',
    zIndex: FULLSCREEN_Z_INDEX,
  },
});

// `createPortal` can only run once hydrated — same post-mount-without-
// setState-in-effect idiom as `mdx/error-decoder.jsx`'s `isHydrated`.
function subscribeNever() {
  return () => {};
}

function getHydrated() {
  return true;
}

function getServerHydrated() {
  return false;
}

/** @type {import('react').Context<{ isFullscreen: boolean, toggle: () => void } | null>} */
const FullscreenContext = createContext(
  /** @type {{ isFullscreen: boolean, toggle: () => void } | null} */ (null),
);

/**
 * Reads the enclosing `FullscreenPanel`'s state, so a descendant anywhere
 * inside it (e.g. a feature's own action-button row) can render its own
 * maximize/restore trigger next to whatever else lives there, instead of
 * `FullscreenPanel` dictating the trigger's position itself — per user
 * request (2026-09-03 follow-up): the toggle should sit beside the page's
 * existing action button, not float on its own in a corner.
 */
export function useFullscreenToggle() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error(
      'useFullscreenToggle must be called within a FullscreenPanel',
    );
  }
  return context;
}

/**
 * Wraps `children` with fullscreen state, exposed to any descendant via
 * `useFullscreenToggle` — this component owns the portal, not the trigger
 * button. Maximized, `children` moves into `#fullscreen-portal-root`, a
 * div `ProtectedAppShell` renders as a sibling of `<main>` for exactly
 * this — see that file for the full reasoning, in short: it must be a
 * *sibling* of `<main>` (not `document.body`) so it stays inside `<Theme>`
 * (component theming keeps resolving — a `document.body` portal escapes
 * `<Theme>`'s own wrapper element entirely, which left buttons rendered
 * with a transparent background), while also *not* being a descendant of
 * `<main>` (whose `isolation: isolate` would otherwise trap a
 * `position: fixed` child's stacking order below the header's z-index-40
 * context regardless of the z-index given to it).
 *
 * **A real bug, found and fixed 2026-09-03 (follow-up report): toggling
 * fullscreen used to reset every bit of state underneath — expanded rows,
 * open dialogs, search text, everything.** The first fix attempt kept a
 * single `createPortal(content, container)` call across every render and
 * only swapped *which* container it targeted between the placeholder and
 * `#fullscreen-portal-root`. That looked right (Portal content is
 * supposed to be DOM-position-independent in the React tree) but verified
 * live it still remounted `content` on every toggle — React does *not*
 * guarantee preserving a portal's children when its `container` argument
 * changes between renders; changing it is enough to make React treat the
 * portal as a different one and tear down the old subtree. The fix that
 * actually holds: `createPortal` always targets the exact same DOM node
 * (`portalContainer`, created once via `useState`'s lazy initializer, so
 * the `container` argument passed to `createPortal` never changes across
 * any render) — moving that container between the placeholder and
 * `#fullscreen-portal-root` in the *visible* DOM is done with plain
 * `container.appendChild(...)` inside a `useLayoutEffect`, entirely
 * outside React's reconciliation. `createPortal` itself never sees a
 * different container, so it never has a reason to remount anything.
 *
 * Not tied to any one feature — deliberately `src/shared/components/` so
 * any page can opt a section into this later, not just Contracts.
 * @param {{ children: import('react').ReactNode }} props
 */
export function FullscreenPanel({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [portalContainer] = useState(() =>
    typeof document === 'undefined' ? null : document.createElement('div'),
  );
  const placeholderRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const isMounted = useSyncExternalStore(
    subscribeNever,
    getHydrated,
    getServerHydrated,
  );

  useLayoutEffect(() => {
    if (!isMounted || !portalContainer) return;

    const target = isFullscreen
      ? (document.getElementById('fullscreen-portal-root') ?? document.body)
      : placeholderRef.current;

    if (target && portalContainer.parentNode !== target) {
      target.appendChild(portalContainer);
    }
    // `isMounted` must be a dependency, not just a guard in the body: the
    // placeholder `<div>` this effect targets (via `placeholderRef`) only
    // exists in the JSX once `isMounted` is true (see the early-return
    // below) — before that, `placeholderRef.current` is null. Without
    // `isMounted` here, this effect's inputs (`isFullscreen`,
    // `portalContainer`) are identical across the "not mounted yet" render
    // and the very next "now mounted" render, so React skips re-running it
    // for that second render — it fires exactly once, sees a null
    // placeholder, appends nothing, and never gets another chance. That
    // silently orphaned `portalContainer` (rendered, just never attached
    // anywhere visible) is what made the whole page render blank.
  }, [isFullscreen, isMounted, portalContainer]);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /** @param {KeyboardEvent} event */
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isFullscreen]);

  // A route change while maximized (e.g. following a link inside the
  // panel) should not leave the next page stuck full-viewport.
  useEffect(() => () => setIsFullscreen(false), []);

  const contextValue = useMemo(
    () => ({
      isFullscreen,
      toggle: () => setIsFullscreen((current) => !current),
    }),
    [isFullscreen],
  );

  // Always the same `<div>` wrapping `children`, whether maximized or
  // not — only its props (the overlay styling) change with `isFullscreen`,
  // never its presence, so this part of the tree never has a reason to
  // remount either.
  const content = (
    <FullscreenContext.Provider value={contextValue}>
      <div
        {...(isFullscreen
          ? stylex.props(appShellContentStyle, styles.overlay)
          : {})}
      >
        {children}
      </div>
    </FullscreenContext.Provider>
  );

  if (!isMounted || !portalContainer) return content;

  return (
    <Fragment>
      <div ref={placeholderRef} />
      {createPortal(content, portalContainer)}
    </Fragment>
  );
}
