'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { MetaPill } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';

const styles = stylex.create({
  // Same frame as the tab's "Đợt chi hoa hồng" card: header band bleeding
  // edge to edge through the card's `--container-padding-*` vars.
  card: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  // Same header tint as the "Đợt chi hoa hồng" table.
  table: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--color-background-muted': 'var(--meta-inset-bg)',
    overflowX: 'auto',
  },
  empty: {
    paddingBlock: 'var(--spacing-6)',
  },
});

/**
 * @typedef {import('../types/index.js').CommissionPayment & { sequence: string }} HistoryRow
 */

/**
 * "Lịch sử thanh toán" on the contract Commission tab — every payment
 * actually made (oldest first), read-only; adding goes through "Thêm lần
 * chi" and editing through the commission drawer.
 * @param {{
 *   payments: import('../types/index.js').CommissionPayment[],
 *   currency: string,
 * }} props
 */
export function CommissionPaymentHistoryCard({ payments, currency }) {
  const rows = [...payments]
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))
    .map((payment, index) => ({
      ...payment,
      sequence: String(index + 1).padStart(2, '0'),
    }));
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

  /** @type {import('@astryxdesign/core/Table').TableColumn<HistoryRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'sequence',
      header: 'Lần',
      width: pixel(88),
      renderCell: (row) => (
        <Text type="inherit" weight="semibold" hasTabularNumbers>
          {row.sequence}
        </Text>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Ngày thanh toán',
      width: proportional(1),
      renderCell: (row) => (
        <Text type="inherit" hasTabularNumbers>
          {formatDisplayDate(row.paymentDate)}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: `Số tiền (${currency})`,
      width: proportional(1),
      align: 'end',
      renderCell: (row) => (
        <Text
          type="inherit"
          weight="bold"
          color={/** @type {any} */ ('meta-green')}
          hasTabularNumbers
        >
          {formatMoney(row.amount)}
        </Text>
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú / Chứng từ',
      width: proportional(2),
      renderCell: (row) => (
        <Text type="inherit" color="secondary" maxLines={1}>
          {row.note?.trim() || '—'}
        </Text>
      ),
    },
  ];

  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={0} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          wrap="wrap"
          xstyle={styles.header}
        >
          <Heading level={3}>Lịch sử thanh toán</Heading>
          {rows.length > 0 ? (
            <MetaPill
              label={`${rows.length} lần • ${formatMoney(total, currency)}`}
              tone="green"
            />
          ) : null}
        </HStack>
        {rows.length === 0 ? (
          <HStack hAlign="center" xstyle={styles.empty}>
            <Text color="secondary">Chưa có lần chi nào.</Text>
          </HStack>
        ) : (
          <Table
            columns={columns}
            data={/** @type {any} */ (rows)}
            idKey="id"
            dividers="rows"
            density="spacious"
            xstyle={styles.table}
          />
        )}
      </VStack>
    </Card>
  );
}
