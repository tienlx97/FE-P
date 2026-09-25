'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Pathnames visited through client-side navigation since the app last
 * loaded. Module state on purpose: it resets on a full page load, which is
 * exactly when `router.back()` can no longer be trusted to stay in the app
 * (deep link, new tab, reload).
 */
let visitedPathnames = /** @type {string[]} */ ([]);

/**
 * Records client-side navigations so `useBackNavigation` knows whether
 * there is an in-app page to go back to. Mount once, in the app shell.
 * Search-param-only changes (tab switches via `router.replace`) keep the
 * same pathname and are not counted.
 */
export function useNavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (visitedPathnames.at(-1) !== pathname) {
      visitedPathnames = [...visitedPathnames.slice(-19), pathname];
    }
  }, [pathname]);
}

/** Whether an earlier in-app page exists to go back to. */
export function hasInAppHistory() {
  return visitedPathnames.length > 1;
}

/**
 * "Quay lại" handler: goes back through browser history when the previous
 * page is inside the app (keeping the list's filters, page and scroll),
 * otherwise navigates to `fallbackHref` — the page's parent — instead of
 * leaving the app or doing nothing.
 * @param {string} fallbackHref
 */
export function useBackNavigation(fallbackHref) {
  const router = useRouter();

  return useCallback(() => {
    if (hasInAppHistory()) {
      visitedPathnames = visitedPathnames.slice(0, -1);
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
