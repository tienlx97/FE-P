'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// A ':' separator, not another '.' — three dot-separated segments reads as
// a JWT to some tooling (observed: a browser devtools helper auto-redacted
// the full key as "[BLOCKED: JWT token]" when inspecting localStorage).
const STORAGE_PREFIX = 'kt-xnk.table-view:';

/** @param {string} raw */
function slugify(raw) {
  return (
    raw
      // Đ/đ isn't decomposable via NFD (it's an atomic Latin letter with a
      // stroke, not a base letter + combining mark), so it survives the next
      // step untouched and would otherwise just get dropped as
      // non-alphanumeric — map it to plain 'd' first.
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );
}

/**
 * @typedef {{
 *   activeColumnKeys?: string[],
 *   columnKeysByScope?: Record<string, string[]>,
 *   density?: string,
 *   stickyStart?: string,
 *   stickyEnd?: string,
 * }} StoredTableView
 */

// One cached snapshot + listener set per storage slug — `useSyncExternalStore`
// requires `getSnapshot` to return a referentially stable value when nothing
// changed (a fresh `JSON.parse` on every call would trip its "the result of
// getSnapshot should be cached" infinite-loop guard), so the parsed value is
// cached here and only re-read on an actual write or a cross-tab `storage`
// event. Keyed per slug (not one module-level object like
// `useLayoutPreferences`) because each list (`entityLabel`) persists
// independently.
/** @type {Map<string, StoredTableView | null>} */
const snapshotBySlug = new Map();
/** @type {Map<string, Set<() => void>>} */
const listenersBySlug = new Map();

/** @param {string} slug */
function readFromStorage(slug) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + slug);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt JSON or inaccessible storage (private mode/quota).
    return null;
  }
}

/** @param {string} slug */
function getListeners(slug) {
  let set = listenersBySlug.get(slug);
  if (!set) {
    set = new Set();
    listenersBySlug.set(slug, set);
  }
  return set;
}

/** @param {string} slug */
function getSnapshot(slug) {
  if (!snapshotBySlug.has(slug)) {
    snapshotBySlug.set(slug, readFromStorage(slug));
  }
  return snapshotBySlug.get(slug);
}

function getServerSnapshot() {
  return null;
}

/** @param {string} slug */
function notify(slug) {
  getListeners(slug).forEach((listener) => listener());
}

/** @param {string} slug @param {Partial<StoredTableView>} partial */
function persist(slug, partial) {
  const next = { ...getSnapshot(slug), ...partial };
  snapshotBySlug.set(slug, next);
  try {
    window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(next));
  } catch {
    // Private-mode/quota errors — stays in-memory for this tab.
  }
  notify(slug);
}

/**
 * Persists `AdvanceTable`'s View-options popover state (column visibility/
 * order, row density, sticky-column edges) to `localStorage`, keyed per
 * list so each caller remembers its own choice across reloads and browser
 * tabs — plain in-component `useState` forgot everything on refresh (user
 * request, 2026-09-16: "sau khi thêm cột, bỏ cột... lưu lại ở local
 * storage"). Same localStorage-over-backend choice as `useLayoutPreferences`,
 * and the same `useSyncExternalStore` idiom — avoids both a hydration
 * mismatch against the server-rendered defaults and the "don't call
 * setState synchronously inside an effect" lint rule a plain read-in-
 * `useEffect` approach trips.
 *
 * Stored column keys are always intersected with the *current*
 * `columnOptions` on read, so a stale key (a column since removed or
 * renamed) never resurfaces, and any `isAlwaysVisible` column stays
 * included even if it predates when the setting was first saved — e.g. a
 * newly-added `COLUMN_OPTIONS` entry a user hasn't toggled on yet.
 * @param {{
 *   storageKey: string,
 *   columnOptions: ReadonlyArray<{ key: string, isAlwaysVisible?: boolean }>,
 *   initialColumnKeys: string[],
 *   columnScope?: string,
 *   defaultStickyStart: 'none' | 'one' | 'two',
 *   defaultStickyEnd: 'none' | 'one' | 'two',
 * }} args
 *
 * `columnScope` keeps a separate column list per scope — `AdvanceTable`
 * passes its active view preset ("Cơ bản" / "Tài chính" …), so a reload
 * shows the default preset with *its* columns (and any edits made to it)
 * instead of the columns of whichever preset was picked last (user
 * request, 2026-09-24: "default khi F5 là tab cơ bản"). Density and
 * sticky edges stay shared across scopes.
 */
export function usePersistedTableViewOptions({
  storageKey,
  columnOptions,
  initialColumnKeys,
  columnScope,
  defaultStickyStart,
  defaultStickyEnd,
}) {
  const slug = useMemo(() => slugify(storageKey), [storageKey]);

  const subscribe = useCallback(
    (/** @type {() => void} */ listener) => {
      const listeners = getListeners(slug);
      listeners.add(listener);
      /** @param {StorageEvent} event */
      const onStorage = (event) => {
        if (event.key !== STORAGE_PREFIX + slug) return;
        snapshotBySlug.delete(slug);
        notify(slug);
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    [slug],
  );
  const getSlugSnapshot = useCallback(() => getSnapshot(slug), [slug]);

  const stored = useSyncExternalStore(
    subscribe,
    getSlugSnapshot,
    getServerSnapshot,
  );

  const storedColumnKeys =
    columnScope === undefined
      ? stored?.activeColumnKeys
      : stored?.columnKeysByScope?.[columnScope];

  const activeColumnKeys = useMemo(() => {
    if (!Array.isArray(storedColumnKeys)) return initialColumnKeys;
    const knownKeys = new Set(columnOptions.map((column) => column.key));
    const filtered = storedColumnKeys.filter((key) => knownKeys.has(key));
    const alwaysVisibleKeys = columnOptions
      .filter((column) => column.isAlwaysVisible)
      .map((column) => column.key)
      .filter((key) => !filtered.includes(key));
    return [...filtered, ...alwaysVisibleKeys];
  }, [storedColumnKeys, columnOptions, initialColumnKeys]);

  const density =
    /** @type {import('@astryxdesign/core/Table').TableDensity} */ (
      typeof stored?.density === 'string' ? stored.density : 'balanced'
    );
  const stickyStart = /** @type {'none' | 'one' | 'two'} */ (
    typeof stored?.stickyStart === 'string'
      ? stored.stickyStart
      : defaultStickyStart
  );
  const stickyEnd = /** @type {'none' | 'one' | 'two'} */ (
    typeof stored?.stickyEnd === 'string' ? stored.stickyEnd : defaultStickyEnd
  );

  const setActiveColumnKeys = useCallback(
    (/** @type {string[]} */ keys) =>
      columnScope === undefined
        ? persist(slug, { activeColumnKeys: keys })
        : persist(slug, {
            columnKeysByScope: {
              ...getSnapshot(slug)?.columnKeysByScope,
              [columnScope]: keys,
            },
          }),
    [slug, columnScope],
  );
  const setDensity = useCallback(
    (/** @type {import('@astryxdesign/core/Table').TableDensity} */ value) =>
      persist(slug, { density: value }),
    [slug],
  );
  const setStickyStart = useCallback(
    (/** @type {'none' | 'one' | 'two'} */ value) =>
      persist(slug, { stickyStart: value }),
    [slug],
  );
  const setStickyEnd = useCallback(
    (/** @type {'none' | 'one' | 'two'} */ value) =>
      persist(slug, { stickyEnd: value }),
    [slug],
  );

  return {
    activeColumnKeys,
    setActiveColumnKeys,
    density,
    setDensity,
    stickyStart,
    setStickyStart,
    stickyEnd,
    setStickyEnd,
  };
}
