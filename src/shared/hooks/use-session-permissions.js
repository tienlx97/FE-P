'use client';

import { useSyncExternalStore } from 'react';

import {
  readSessionPermissions,
  SESSION_CHANGE_EVENT,
} from '@/shared/api/session-cookies.js';

const EMPTY_PERMISSIONS = /** @type {string[]} */ ([]);

/** @param {() => void} callback */
function subscribeToSessionChange(callback) {
  window.addEventListener(SESSION_CHANGE_EVENT, callback);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, callback);
}

// `readSessionPermissions` parses JSON on every call, so it returns a new
// array reference each time even when the cookie hasn't changed —
// `useSyncExternalStore` requires a stable reference when nothing actually
// changed, or it tears with "Maximum update depth exceeded". Cache by
// content, not just re-parse and return.
let lastSnapshot = EMPTY_PERMISSIONS;

function getSnapshot() {
  const next = readSessionPermissions();
  const isSameAsLast =
    next.length === lastSnapshot.length &&
    next.every((value, index) => value === lastSnapshot[index]);

  if (!isSameAsLast) {
    lastSnapshot = next;
  }

  return lastSnapshot;
}

function getServerSnapshot() {
  return EMPTY_PERMISSIONS;
}

/**
 * The signed-in user's `permissions` claim (see
 * `openspec/changes/permission-based-nav-route-gating/`) — lives in
 * `shared/`, not the `auth` feature, so every other feature can gate a UI
 * element on a permission string without a cross-feature import (`auth`'s
 * own `useSession` delegates here too, for the same reason it reads every
 * other session cookie from `shared/api/session-cookies.js`).
 * @returns {string[]}
 */
export function useSessionPermissions() {
  return useSyncExternalStore(
    subscribeToSessionChange,
    getSnapshot,
    getServerSnapshot,
  );
}
