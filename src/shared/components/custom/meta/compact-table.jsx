'use client';

import { HStack } from '@astryxdesign/core/HStack';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';

/**
 * Small read-only "Meta" table for a card body — same header / cell look
 * as `MetaVgmPanel`'s table (caps muted headers on the hover tint, compact
 * rows, content-sized columns, cells that wrap only where `isWrapping`).
 * Put it last in its card: Astryx `Table` bleeds to the card's side and
 * bottom edges itself.
 *
 * @param {{
 *   columns: Array<{ key: string, header: string, align?: 'start' | 'center' | 'end', isWrapping?: boolean }>,
 *   rows: Array<{ id: string, cells: Record<string, import('react').ReactNode> }>,
 *   emptyLabel: string,
 * }} props
 */
export function MetaCompactTable({ columns, rows, emptyLabel }) {
  if (rows.length === 0) {
    return (
      <HStack hAlign="center" xstyle={styles.emptyRow}>
        <Text color="secondary">{emptyLabel}</Text>
      </HStack>
    );
  }

  return (
    <Table density="compact" dividers="rows" xstyle={styles.table}>
      <TableHeader>
        <TableRow isHeaderRow>
          {columns.map((column) => (
            <TableHeaderCell
              key={column.key}
              scope="col"
              xstyle={[styles.headCell, alignStyles[column.align ?? 'start']]}
            >
              <Text
                size="sm"
                weight="bold"
                color="secondary"
                xstyle={styles.headLabel}
              >
                {column.header}
              </Text>
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                xstyle={[
                  styles.cell,
                  alignStyles[column.align ?? 'start'],
                  column.isWrapping && styles.wrapCell,
                ]}
              >
                {row.cells[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const styles = stylex.create({
  table: {
    tableLayout: 'auto',
  },
  // Astryx cells default to `max-width: 0` (truncation); lift it so the
  // auto table layout sizes columns to content.
  headCell: {
    backgroundColor: 'var(--meta-row-hover)',
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'normal',
  },
  headLabel: {
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  cell: {
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'nowrap',
  },
  wrapCell: {
    minWidth: 'calc(2 * var(--spacing-12))',
    whiteSpace: 'normal',
  },
  emptyRow: {
    paddingBlock: 'var(--spacing-8)',
  },
});

const alignStyles = stylex.create({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});
