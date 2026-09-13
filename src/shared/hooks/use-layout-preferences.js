'use client';

import { useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'kt-xnk.layout-preferences';
const DEFAULT_STATE = { hideSideNav: false, focusMode: false };

// Module-level store, not per-component state: the Settings toggle lives
// deep in the header's `endContent` while `ProtectedAppShell` (which
// actually applies these — hiding the aside, hiding the header in focus
// mode) is several layers up with no prop path between them. Persisted to
// localStorage so the preference survives a reload; synced across tabs via
// the `storage` event.
let state = DEFAULT_STATE;
const listeners = new Set();

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      hideSideNav: Boolean(parsed.hideSideNav),
      focusMode: Boolean(parsed.focusMode),
    };
  } catch {
    // Corrupt JSON or inaccessible storage (private mode/quota) — fall
    // back to defaults instead of throwing.
    return DEFAULT_STATE;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** @param {Partial<typeof DEFAULT_STATE>} partial */
function setState(partial) {
  state = { ...state, ...partial };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private-mode/quota errors — preference stays in-memory for this tab.
  }
  notify();
}

/** @param {() => void} listener */
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// Server (and the very first client render, before hydration) always sees
// the defaults — `state` is only ever updated client-side, inside the
// effect below, which runs after that first render commits. Reading
// localStorage synchronously at module scope instead would desync the
// server-rendered HTML from the client's first paint (a hydration
// mismatch) whenever a stored preference differs from the default.
function getServerSnapshot() {
  return DEFAULT_STATE;
}

/**
 * App-wide layout preferences: hiding the side nav, and a chromeless
 * "focus mode" (hides both the side nav and the top header). Read by
 * `ProtectedAppShell` to actually apply them; written by the Settings
 * popover trigger rendered in the header's `endContent`.
 */
export function useLayoutPreferences() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const stored = readFromStorage();
    if (
      stored.hideSideNav !== state.hideSideNav ||
      stored.focusMode !== state.focusMode
    ) {
      state = stored;
      notify();
    }

    /** @param {StorageEvent} event */
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      state = readFromStorage();
      notify();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return {
    hideSideNav: snapshot.hideSideNav,
    focusMode: snapshot.focusMode,
    setHideSideNav: (/** @type {boolean} */ value) =>
      setState({ hideSideNav: value }),
    setFocusMode: (/** @type {boolean} */ value) =>
      setState({ focusMode: value }),
  };
}
