'use client';

import { Table as AstryxTable } from '@astryxdesign/core/Table';
import * as stylex from '@stylexjs/stylex';

import { useCompactMode } from '@/shared/hooks/use-layout-preferences.js';

/**
 * Astryx `Table` that follows the "Chế độ thu gọn" layout preference: on,
 * every table renders at compact row density; off, the table's own
 * `density` (Astryx default `balanced`). Import `Table` from here, not from
 * `@astryxdesign/core/Table` (lint-enforced); the other Table parts still
 * come from Astryx.
 *
 * Cells that set their own block padding (which beats density) read it as
 * `var(--table-compact-padding-block, <own value>)`: the variable is only
 * defined, on the table, while compact mode is on.
 *
 * @template {Record<string, unknown>} T
 * @param {import('@astryxdesign/core/Table').TableProps<T>} props
 */
export function Table(props) {
  const compactMode = useCompactMode();
  return (
    <AstryxTable
      {...props}
      density={compactMode ? 'compact' : props.density}
      xstyle={
        compactMode
          ? /** @type {import('@stylexjs/stylex').StyleXStyles} */ ([
              props.xstyle,
              styles.compact,
            ])
          : props.xstyle
      }
    />
  );
}

const styles = stylex.create({
  compact: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--table-compact-padding-block': 'var(--spacing-1)',
  },
});
