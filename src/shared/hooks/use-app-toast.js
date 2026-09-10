'use client';

import { useToast } from '@astryxdesign/core/Toast';

// astryx's default (5000ms) is too short for the Vietnamese sentences this
// app shows ("Đã cập nhật hợp đồng.", etc.) — per user request (2026-09-08),
// give every toast more time to read before it auto-dismisses.
const AUTO_HIDE_DURATION = 9000;

/**
 * astryx's `ToastViewport` promotes itself to the CSS top layer via
 * `popover="manual"` + `showPopover()` once, in an effect that runs on
 * mount (app startup) — see the library's `ToastViewport.tsx`. A native
 * `<dialog>` (astryx's `Dialog`, used by every `*FormDialog` in this app)
 * enters the top layer later, when it opens. Top-layer stacking is
 * insertion order, not DOM order or z-index, so a toast fired while a
 * dialog is open renders *behind* it — invisible — because the viewport
 * joined the top layer first, at app mount.
 *
 * Re-showing the popover moves it back to the top of the top-layer stack,
 * above whatever dialog is currently open. Hide+show happen synchronously
 * in the same task, before the browser paints, so already-visible toasts
 * don't flash.
 *
 * Only runs while a `<dialog>` is actually open — the hide/show cycle
 * forces the viewport (and every toast inside it) to `display: none` and
 * back, which cancels any CSS transition in flight. Doing this
 * unconditionally on every toast, as an earlier version did, could land
 * mid-way through another toast's manual-dismiss exit transition and
 * cancel it — `ToastViewport`'s `onTransitionEnd` (the only thing that
 * actually removes a dismissed toast from state) then never fires, so that
 * toast got stuck rendered forever, un-dismissable (a second click is a
 * no-op — the viewport already marked it exiting). Gating on an open
 * dialog keeps the fix scoped to the case it was written for, instead of
 * running on every toast regardless of whether one is mid-exit.
 */
function promoteToastViewportAboveDialogs() {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('dialog[open]')) return;
  const viewport =
    /** @type {(HTMLElement & { showPopover?: () => void, hidePopover?: () => void }) | null} */ (
      document.querySelector('[role="region"][popover="manual"]')
    );
  if (!viewport || typeof viewport.showPopover !== 'function') return;
  try {
    viewport.hidePopover?.();
  } catch {
    /* wasn't showing */
  }
  try {
    viewport.showPopover();
  } catch {
    /* already showing (race with the library's own mount effect) */
  }
}

/**
 * Wraps astryx's `useToast` with kt-xnk defaults: every call site in this
 * app fires a toast to confirm a save, so `type` defaults to `'success'`
 * (astryx only ships `'info' | 'error'` — `'success'` is themed green via
 * `theme.js`'s `toast: { 'type:success': ... }` override) instead of the
 * library's neutral `'info'`. Pass `type: 'error'` explicitly to override.
 *
 * Most call sites fire this from a `*FormDialog`'s `onSuccess`, in the same
 * handler that also closes the dialog (`onOpenChange(false)`). Calling
 * `toast()` synchronously there mounts the toast in the same tick astryx's
 * `<dialog>` starts tearing down — its CSS enter transition (`@starting-style`
 * grid-template-rows 0fr -> 1fr) then never resolves, leaving the toast
 * permanently 0px tall (mounted, but invisible; confirmed via
 * getBoundingClientRect while testing this hook against the dev stack).
 * Deferring the call by a tick lets the dialog finish closing first, so the
 * toast mounts on a clean frame and its enter transition actually runs.
 *
 * Some call sites (e.g. an error toast from a nested field editor that
 * doesn't close its parent `*FormDialog`) fire while a dialog stays open —
 * see `promoteToastViewportAboveDialogs` above for why that needs its own
 * fix.
 * @returns {(options: Omit<Parameters<ReturnType<typeof useToast>>[0], 'type'> & { type?: 'success' | 'info' | 'error' }) => void}
 */
export function useAppToast() {
  const toast = useToast();
  return (options) => {
    setTimeout(() => {
      promoteToastViewportAboveDialogs();
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
