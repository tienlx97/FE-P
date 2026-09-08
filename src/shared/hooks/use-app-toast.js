'use client';

import { useToast } from '@astryxdesign/core/Toast';

// astryx's default (5000ms) is too short for the Vietnamese sentences this
// app shows ("Đã cập nhật hợp đồng.", etc.) — per user request (2026-09-08),
// give every toast more time to read before it auto-dismisses.
const AUTO_HIDE_DURATION = 9000;

/**
 * Wraps astryx's `useToast` with kt-xnk defaults: every call site in this
 * app fires a toast to confirm a save, so `type` defaults to `'success'`
 * (astryx only ships `'info' | 'error'` — `'success'` is themed green via
 * `theme.js`'s `toast: { 'type:success': ... }` override) instead of the
 * library's neutral `'info'`. Pass `type: 'error'` explicitly to override.
 *
 * Every real call site fires this from a `*FormDialog`'s `onSuccess`, in the
 * same handler that also closes the dialog (`onOpenChange(false)`). Calling
 * `toast()` synchronously there mounts the toast in the same tick astryx's
 * `<dialog>` starts tearing down — its CSS enter transition (`@starting-style`
 * grid-template-rows 0fr -> 1fr) then never resolves, leaving the toast
 * permanently 0px tall (mounted, but invisible; confirmed via
 * getBoundingClientRect while testing this hook against the dev stack).
 * Deferring the call by a tick lets the dialog finish closing first, so the
 * toast mounts on a clean frame and its enter transition actually runs.
 * @returns {(options: Omit<Parameters<ReturnType<typeof useToast>>[0], 'type'> & { type?: 'success' | 'info' | 'error' }) => void}
 */
export function useAppToast() {
  const toast = useToast();
  return (options) => {
    setTimeout(() => {
      toast(
        /** @type {Parameters<ReturnType<typeof useToast>>[0]} */ ({
          type: 'success',
          autoHideDuration: AUTO_HIDE_DURATION,
          ...options,
        }),
      );
    }, 0);
  };
}
