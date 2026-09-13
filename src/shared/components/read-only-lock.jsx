'use client';

import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { cloneElement, isValidElement } from 'react';

const styles = stylex.create({
  // Matches the tint `theme.js` gives native `isReadOnly` TextInput/
  // NumberInput/Textarea — those get it for free from Astryx's `readonly`
  // theme state, but Selector/DateInput/CheckboxList have no such state to
  // hook (no native `isReadOnly`), so a read-only Selector used to render
  // with a plain white background right next to a tinted read-only
  // TextInput in the same field grid. Background only, same reasoning as
  // theme.js's text-input/number-input/textarea overrides: clearing a
  // border here could erase a shared InputGroup seam.
  tinted: { backgroundColor: colorVars['--color-background-muted'] },
});

/**
 * @param {import('react').KeyboardEvent} event
 */
function isAllowedKeyEvent(event) {
  if (event.ctrlKey || event.metaKey) {
    // Copy and select-all pass through (reading the value); anything else
    // held with Ctrl/Cmd (paste, cut, undo, redo...) is blocked below.
    return ['c', 'a', 'C', 'A'].includes(event.key);
  }
  // Tab/Shift move focus; Escape closes a stray native popover; the rest
  // let the cursor move through and select already-shown text without
  // changing it.
  return [
    'Tab',
    'Shift',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ].includes(event.key);
}

/**
 * Locks a value-editing control that has no native `isReadOnly` of its own
 * — Astryx's `Selector`/`DateInput`/`CheckboxList` only expose `isDisabled`,
 * which dims the control and drops it from the tab order (see each
 * component's own docs) — the opposite of what a Xem field needs: full
 * opacity, selectable/announced value, still reachable by Tab, just not
 * editable (`openspec/changes/logistics-workspace-redesign/design.md`
 * section 1).
 *
 * Renders as `display: contents` so the wrapper adds no box of its own —
 * the wrapped control keeps its exact geometry, margins, and position in
 * its parent's layout — while a capture-phase `click`/`keydown` listener
 * still fires correctly (capture order follows the DOM tree, not the box
 * tree, so `display: contents` doesn't defeat it). `stopPropagation` there
 * keeps the click/keystroke from ever reaching the control's own
 * open/change handlers, so it never opens a menu or calendar, or accepts
 * typed input — pass the control its normal `isDisabled={false}` (or
 * simply omit it) so it keeps its enabled appearance and tab stop.
 *
 * Also clones the child to add the same muted background `theme.js` gives
 * a native `isReadOnly` TextInput/NumberInput/Textarea — Selector/
 * DateInput/CheckboxList have no `readonly` theme state of their own to
 * hook (no native `isReadOnly` prop for it to key off), so without this a
 * read-only Selector used to render with a plain white background right
 * next to a tinted read-only TextInput in the same field grid (reported
 * 2026-09-14). `cloneElement` merges into the child's own `xstyle` rather
 * than replacing it, since some callers already pass one.
 *
 * Deliberately does not attempt `aria-readonly`/`role` on this element:
 * `display: contents` removes an element from the accessibility tree in
 * every major engine, so ARIA attributes placed here would be silently
 * dropped — there is no reliable way to announce "read-only" beyond what
 * this wrapper already does (keep the control focusable and its value
 * readable, just inert to input).
 * @param {{ isActive: boolean, children: import('react').ReactNode }} props
 */
export function ReadOnlyLock({ isActive, children }) {
  if (!isActive) return children;
  let tintedChild = children;
  if (isValidElement(children)) {
    const element =
      /** @type {import('react').ReactElement<{ xstyle?: unknown }>} */ (
        children
      );
    const existingXstyle = element.props.xstyle;
    tintedChild = cloneElement(element, {
      xstyle: [
        .../** @type {unknown[]} */ (
          Array.isArray(existingXstyle) ? existingXstyle : [existingXstyle]
        ),
        styles.tinted,
      ].filter(Boolean),
    });
  }
  return (
    <span
      // Plain data attribute, not ARIA — `display: contents` drops this
      // span from the accessibility tree regardless (see the doc comment
      // above), so an `aria-*` attribute here would be silently discarded,
      // but a `data-*` one still resolves via `closest()` on the DOM tree.
      // Lets tooling (e.g. `harness/checks/stable-dialog-layout-browser.mjs`)
      // recognize this as the read-only mechanism it is, without adding
      // anything screen readers would pick up.
      data-readonly-lock="true"
      style={{ display: 'contents' }}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDownCapture={(event) => {
        if (!isAllowedKeyEvent(event)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onPasteCapture={(event) => event.preventDefault()}
      onCutCapture={(event) => event.preventDefault()}
    >
      {tintedChild}
    </span>
  );
}
