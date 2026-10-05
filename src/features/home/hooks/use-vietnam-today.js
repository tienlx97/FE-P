'use client';
import { useSyncExternalStore } from 'react';

const DATE_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "YYYY-MM-DD" in Vietnam time; a string so the snapshot is stable within a day. */
function todayKey() {
  return DATE_PARTS.format(new Date());
}

/** Re-check every minute so the calendar turns the page at Vietnam midnight. */
function subscribe(/** @type {() => void} */ onChange) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/**
 * Today's Vietnam date as {day, month, year}, or null while server rendering
 * (the server's clock and time zone must not decide the user's calendar page).
 */
export function useVietnamToday() {
  const key = useSyncExternalStore(subscribe, todayKey, () => null);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return { day, month, year };
}
