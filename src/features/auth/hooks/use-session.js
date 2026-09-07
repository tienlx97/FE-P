'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import {
  clearSession,
  hasSessionCookie,
  readSessionDisplayName,
  readSessionEmployeeCode,
  SESSION_CHANGE_EVENT,
} from '@/shared/api/session-cookies.js';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

/** @param {() => void} callback */
function subscribeToSessionChange(callback) {
  window.addEventListener(SESSION_CHANGE_EVENT, callback);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, callback);
}

function getIsAuthenticated() {
  // Not the access token — that cookie is HttpOnly and invisible here. A
  // readable companion cookie stands in; both are written and cleared together
  // by /api/session (docs/security.md, H-4).
  return hasSessionCookie();
}

function getIsAuthenticatedServerSnapshot() {
  return false;
}

function getDisplayName() {
  return readSessionDisplayName();
}

function getDisplayNameServerSnapshot() {
  return '';
}

function getEmployeeCode() {
  return readSessionEmployeeCode();
}

function getEmployeeCodeServerSnapshot() {
  return '';
}

export function useSession() {
  const router = useRouter();
  const isAuthenticated = useSyncExternalStore(
    subscribeToSessionChange,
    getIsAuthenticated,
    getIsAuthenticatedServerSnapshot,
  );
  const displayName = useSyncExternalStore(
    subscribeToSessionChange,
    getDisplayName,
    getDisplayNameServerSnapshot,
  );
  const employeeCode = useSyncExternalStore(
    subscribeToSessionChange,
    getEmployeeCode,
    getEmployeeCodeServerSnapshot,
  );
  const permissions = useSessionPermissions();

  async function logout() {
    await clearSession();
    router.push('/login');
  }

  return { isAuthenticated, displayName, employeeCode, permissions, logout };
}
