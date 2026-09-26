'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

// One per real tab: Tổng quan, Tiến độ thanh toán, Lô hàng, Phụ lục,
// Hoa hồng, BOQ.
const TAB_WIDTHS = ['9rem', '10rem', '9rem', '8rem', '10rem', '5rem'];
const KPI_CARDS = [0, 1, 2, 3];
const INSTALLMENTS = [0, 1, 2];
// Rows per card in each of `MetaContractInfoGrid`'s three columns.
const INFO_COLUMNS = [
  [5, 3],
  [5, 2],
  [4, 3],
];

/**
 * "Meta" contract-detail page placeholder, shown while the contract itself
 * loads (instead of a lone spinner): the header card (code, pills, project
 * line, action buttons), the pill tab strip, then the default "Tổng quan"
 * tab — `MetaOverviewSummaryCard` (4 KPI cards, payment progress,
 * installments) and `MetaContractInfoGrid`'s three card columns — using
 * the same grids / breakpoints as the real page so nothing jumps when data
 * arrives at any desktop width. Text bars size in `%` / `clamp()`, never a
 * fixed width alone. Astryx `Skeleton` blocks inside `Card` / `Grid` /
 * stacks (golden rule #15).
 *
 * Opened on another tab (`?tab=commission` …), the body is a neutral
 * titled card instead, so the overview's KPI / installment frame doesn't
 * flash before an unrelated tab layout.
 *
 * @param {{ label?: string, tab?: string }} props
 */
export function MetaContractDetailSkeleton({
  label = 'Đang tải hợp đồng',
  tab = 'overview',
}) {
  return (
    <VStack gap={3} hAlign="stretch" aria-busy="true" aria-label={label}>
      <Card padding={5} xstyle={styles.card}>
        <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
          <VStack gap={2} hAlign="stretch" xstyle={styles.headerText}>
            <HStack gap={2} vAlign="center">
              <Skeleton
                width="clamp(6rem, 30%, 9rem)"
                height="var(--spacing-7)"
                radius={2}
              />
              <Skeleton
                width="clamp(4rem, 18%, 6rem)"
                height="var(--spacing-6)"
                radius="rounded"
              />
              <Skeleton
                width="clamp(5rem, 24%, 8rem)"
                height="var(--spacing-6)"
                radius="rounded"
              />
            </HStack>
            <Skeleton
              width="clamp(10rem, 55%, 16rem)"
              height="var(--spacing-4)"
              radius={2}
              index={1}
            />
          </VStack>
          <HStack gap={2} vAlign="center">
            {['6.5rem', '7rem', '8.5rem'].map((width) => (
              <Skeleton
                key={width}
                width={width}
                height="var(--spacing-9)"
                radius="rounded"
                index={1}
              />
            ))}
          </HStack>
        </HStack>
      </Card>

      <HStack gap={1.5} vAlign="center" wrap="wrap" xstyle={styles.tabs}>
        {TAB_WIDTHS.map((width, index) => (
          <Skeleton
            key={index}
            width={width}
            height="var(--spacing-9)"
            radius="rounded"
            index={index}
          />
        ))}
      </HStack>

      {tab === 'overview' ? (
        <>
          <OverviewCardSkeleton />
          <InfoGridSkeleton />
        </>
      ) : (
        <TabBodySkeleton />
      )}
    </VStack>
  );
}

const TAB_BODY_ROWS = [0, 1, 2];

/** Any non-overview tab: a titled card with a few rows. */
function TabBodySkeleton() {
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={5} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.titleRow}>
          <Skeleton
            width="clamp(10rem, 30%, 18rem)"
            height="var(--spacing-5)"
            radius={2}
          />
        </HStack>
        {TAB_BODY_ROWS.map((index) => (
          <Skeleton
            key={index}
            height="var(--spacing-6)"
            radius={2}
            index={index}
          />
        ))}
      </VStack>
    </Card>
  );
}

/** `MetaOverviewSummaryCard`'s frame: title, 4 KPIs, progress, installments. */
function OverviewCardSkeleton() {
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={5} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.titleRow}>
          <Skeleton
            width="var(--spacing-6)"
            height="var(--spacing-6)"
            radius="rounded"
          />
          <Skeleton
            width="clamp(10rem, 30%, 18rem)"
            height="var(--spacing-5)"
            radius={2}
          />
        </HStack>

        <Grid
          columns={{ minWidth: 280, max: 4 }}
          maxWidth="calc(4 * var(--meta-kpi-card-max) + 3 * var(--spacing-4))"
          gap={4}
          xstyle={styles.singleColumnOnPhone}
        >
          {KPI_CARDS.map((index) => (
            <VStack key={index} gap={4} hAlign="stretch" xstyle={styles.kpi}>
              <HStack hAlign="between" vAlign="center" gap={2}>
                <Skeleton
                  width="45%"
                  height="var(--spacing-3)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="var(--spacing-8)"
                  height="var(--spacing-8)"
                  radius={2}
                  index={index}
                />
              </HStack>
              <Skeleton
                width="60%"
                height="var(--spacing-7)"
                radius={2}
                index={index}
              />
              <Skeleton
                height="var(--spacing-1)"
                radius="rounded"
                index={index}
              />
            </VStack>
          ))}
        </Grid>

        <VStack gap={3} hAlign="stretch" xstyle={styles.progressSection}>
          <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
            <Skeleton
              width="clamp(10rem, 25%, 14rem)"
              height="var(--spacing-5)"
              radius={2}
            />
            <Skeleton
              width="clamp(10rem, 25%, 16rem)"
              height="var(--spacing-4)"
              radius={2}
            />
          </HStack>
          <Skeleton
            height="calc(var(--spacing-2) + var(--spacing-0-5))"
            radius="rounded"
          />
          <Grid columns={{ minWidth: 180, repeat: 'fill' }} gap={3}>
            {INSTALLMENTS.map((index) => (
              <VStack
                key={index}
                gap={2}
                hAlign="stretch"
                xstyle={styles.installment}
              >
                <Skeleton
                  width="50%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="70%"
                  height="var(--spacing-5)"
                  radius={2}
                  index={index}
                />
              </VStack>
            ))}
          </Grid>
        </VStack>
      </VStack>
    </Card>
  );
}

/** `MetaContractInfoGrid`'s frame: three columns of titled cards. */
function InfoGridSkeleton() {
  return (
    <Grid
      columns={{ minWidth: 340, max: 3 }}
      gap={5}
      xstyle={[styles.singleColumnOnPhone, styles.infoGrid]}
    >
      {INFO_COLUMNS.map((cards, column) => (
        <VStack key={column} gap={4} hAlign="stretch">
          <Skeleton
            width="clamp(8rem, 55%, 14rem)"
            height="var(--spacing-4)"
            radius={2}
            index={column}
          />
          {cards.map((rows, card) => (
            <Card key={card} padding={5} xstyle={styles.card}>
              <VStack gap={3} hAlign="stretch">
                <Skeleton
                  width="45%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={column + card}
                />
                {Array.from({ length: rows }, (_, row) => (
                  <HStack key={row} hAlign="between" vAlign="center" gap={3}>
                    <Skeleton
                      width="30%"
                      height="var(--spacing-3)"
                      radius={2}
                      index={column + row}
                    />
                    <Skeleton
                      width="40%"
                      height="var(--spacing-3)"
                      radius={2}
                      index={column + row}
                    />
                  </HStack>
                ))}
              </VStack>
            </Card>
          ))}
        </VStack>
      ))}
    </Grid>
  );
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  // Code / pills / project line take what the action buttons leave.
  headerText: {
    flexBasis: 'calc(var(--spacing-10) * 8)',
    flexGrow: 1,
    minWidth: 0,
  },
  tabs: {
    paddingBlock: 'var(--spacing-1)',
  },
  titleRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-3)',
  },
  singleColumnOnPhone: {
    gridTemplateColumns: {
      // Keep Grid's own template: in production StyleX hashes this key to
      // the same one Grid uses, so `null` would drop Grid's columns.
      default: 'var(--x-gridTemplateColumns)',
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  infoGrid: {
    alignItems: 'start',
    width: '100%',
  },
  // `MetaOverviewSummaryCard`'s metric tile frame.
  kpi: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  progressSection: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-3)',
  },
  installment: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
});
