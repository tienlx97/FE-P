'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

const TAB_WIDTHS = ['9rem', '10rem', '10rem', '8.5rem', '11rem'];
const KPI_CARDS = [0, 1, 2];
const TABLE_ROWS = [0, 1, 2, 3];

/**
 * "Meta" contract-detail page placeholder, shown while the contract itself
 * loads (instead of a lone spinner): the header card (code, pills, project
 * line, action buttons), the pill tab strip, then a generic tab body —
 * a row of KPI cards and a table card — in the same shapes and spacing as
 * the real page so nothing jumps when data arrives. Astryx `Skeleton`
 * blocks inside `Card` / `Grid` / stacks (golden rule #15).
 *
 * @param {{ label?: string }} props
 */
export function MetaContractDetailSkeleton({ label = 'Đang tải hợp đồng' }) {
  return (
    <VStack gap={3} hAlign="stretch" aria-busy="true" aria-label={label}>
      <Card padding={5} xstyle={styles.card}>
        <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
          <VStack gap={2} hAlign="start">
            <HStack gap={2} vAlign="center">
              <Skeleton width="11rem" height="var(--spacing-7)" radius={2} />
              <Skeleton
                width="6rem"
                height="var(--spacing-6)"
                radius="rounded"
              />
              <Skeleton
                width="8rem"
                height="var(--spacing-6)"
                radius="rounded"
              />
            </HStack>
            <Skeleton
              width="18rem"
              height="var(--spacing-4)"
              radius={2}
              index={1}
            />
          </VStack>
          <HStack gap={2} vAlign="center">
            <Skeleton
              width="6.5rem"
              height="var(--spacing-9)"
              radius="rounded"
              index={1}
            />
            <Skeleton
              width="7rem"
              height="var(--spacing-9)"
              radius="rounded"
              index={1}
            />
            <Skeleton
              width="8.5rem"
              height="var(--spacing-9)"
              radius="rounded"
              index={1}
            />
          </HStack>
        </HStack>
      </Card>

      <HStack gap={1.5} vAlign="center" wrap="wrap" xstyle={styles.tabs}>
        {TAB_WIDTHS.map((width, index) => (
          <Skeleton
            key={width + index}
            width={width}
            height="var(--spacing-9)"
            radius="rounded"
            index={index}
          />
        ))}
      </HStack>

      <Grid
        columns={{ minWidth: 320, max: 3 }}
        maxWidth="calc(3 * var(--meta-panel-card-max) + 2 * var(--spacing-5))"
        gap={5}
        xstyle={styles.kpiGrid}
      >
        {KPI_CARDS.map((index) => (
          <Card key={index} padding={6} xstyle={styles.card}>
            <VStack gap={4} hAlign="stretch">
              <HStack hAlign="between" vAlign="center">
                <Skeleton
                  width="40%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="var(--spacing-9)"
                  height="var(--spacing-9)"
                  radius="rounded"
                  index={index}
                />
              </HStack>
              <Skeleton
                width="55%"
                height="var(--spacing-7)"
                radius={2}
                index={index}
              />
              <Skeleton
                height="var(--spacing-2)"
                radius="rounded"
                index={index}
              />
              <Skeleton
                width="65%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
            </VStack>
          </Card>
        ))}
      </Grid>

      <Card padding={6} xstyle={styles.card}>
        <VStack gap={0} hAlign="stretch">
          <HStack
            hAlign="between"
            vAlign="center"
            gap={3}
            xstyle={styles.tableTitle}
          >
            <HStack gap={3} vAlign="center">
              <Skeleton
                width="var(--spacing-8)"
                height="var(--spacing-8)"
                radius="rounded"
              />
              <VStack gap={1.5}>
                <Skeleton width="14rem" height="var(--spacing-5)" radius={2} />
                <Skeleton width="22rem" height="var(--spacing-3)" radius={2} />
              </VStack>
            </HStack>
            <Skeleton
              width="11rem"
              height="var(--spacing-9)"
              radius="rounded"
            />
          </HStack>
          {TABLE_ROWS.map((index) => (
            <HStack
              key={index}
              gap={6}
              vAlign="center"
              xstyle={styles.tableRow}
            >
              <Skeleton
                width="10%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="12%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="16%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="10%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="9%"
                height="var(--spacing-6)"
                radius="rounded"
                index={index}
              />
              <Skeleton
                width="22%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
            </HStack>
          ))}
        </VStack>
      </Card>
    </VStack>
  );
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  tabs: {
    paddingBlock: 'var(--spacing-1)',
  },
  kpiGrid: {
    gridTemplateColumns: {
      default: null,
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  tableTitle: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-5)',
  },
  tableRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-5)',
  },
});
