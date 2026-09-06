'use client';

import { DropdownMenu, DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

// DropdownMenu's declarative `items` option has no per-item hover-color hook,
// so the green hover treatment (per user request 2026-09-06) needs compound
// mode (`DropdownMenuItem` children) — the only surface that accepts `xstyle`.
const styles = stylex.create({
  greenHover: {
    backgroundColor: {
      default: null,
      ':hover': colorVars['--color-background-green'],
      ':focus': colorVars['--color-background-green'],
    },
  },
  // Trigger button's label/icon text recolored green (per user request
  // 2026-09-06) so "Chức năng" reads as a distinct action instead of the
  // default ghost gray; Button spreads its own variant style before xstyle,
  // so this wins. Text color only — hover background stays the default.
  greenButton: {
    color: colorVars['--color-text-green'],
  },
});

/** @param {{ onView: () => void, onEdit: () => void }} props */
export function RecordActionsMenu({ onView, onEdit }) {
  return (
    <HStack
      width="100%"
      hAlign="end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu
        button={{
          label: 'Chức năng',
          variant: 'ghost',
          size: 'sm',
          xstyle: styles.greenButton,
        }}
        alignment="end"
      >
        <DropdownMenuItem label="Xem" onClick={onView} xstyle={styles.greenHover} />
        <DropdownMenuItem label="Sửa" onClick={onEdit} xstyle={styles.greenHover} />
      </DropdownMenu>
    </HStack>
  );
}
