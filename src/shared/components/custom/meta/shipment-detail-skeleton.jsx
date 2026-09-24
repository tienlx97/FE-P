'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { MetaJourneySkeleton } from './shipment-header-card.jsx';

const TAB_WIDTHS = ['8rem', '6.5rem', '10rem'];
const KPI_CARDS = [0, 1, 2];
// Booking (9 fields) then customs (6), like the overview tab.
const SECTION_FIELD_COUNTS = [9, 6];
const TABLE_ROWS = [0, 1, 2, 3, 4];

/**
 * "Meta" shipment-detail page placeholder, shown while the contract /
 * shipment load: the `MetaShipmentHeaderCard` (code + pills + incoterm,
 * action buttons, the journey title and `MetaJourneySkeleton`), the pill
 * tab strip, then the active tab's body — overview: 3 KPI cards and two
 * sections of 3-column field tiles (`MetaShipmentKpiCard` /
 * `MetaShipmentSection` / `MetaShipmentField` shapes); VGM / costs: one
 * table card — so nothing jumps when data arrives. Astryx `Skeleton`
 * blocks inside `Card` / `Grid` / stacks (golden rule #15).
 *
 * @param {{
 *   tab?: 'overview' | 'vgm' | 'costs',
 *   label?: string,
 * }} props
 */
export function MetaShipmentDetailSkeleton({
  tab = 'overview',
  label = 'Đang tải lô hàng',
}) {
  return (
    <VStack gap={4} hAlign="stretch" aria-busy="true" aria-label={label}>
      <Card padding={6} xstyle={styles.card}>
        <VStack gap={6} hAlign="stretch">
          <HStack
            hAlign="between"
            vAlign="start"
            gap={4}
            wrap="wrap"
            xstyle={styles.titleRow}
          >
            <VStack gap={2} hAlign="start">
              <HStack gap={2} vAlign="center">
                <Skeleton width="13rem" height="var(--spacing-10)" radius={2} />
                <Skeleton
                  width="var(--spacing-8)"
                  height="var(--spacing-8)"
                  radius={2}
                />
                <Skeleton
                  width="3.5rem"
                  height="var(--spacing-6)"
                  radius="rounded"
                />
                <Skeleton
                  width="7rem"
                  height="var(--spacing-6)"
                  radius="rounded"
                />
              </HStack>
              <Skeleton
                width="5rem"
                height="var(--spacing-6)"
                radius="rounded"
                index={1}
              />
            </VStack>
            <HStack gap={2} vAlign="center">
              <Skeleton
                width="4rem"
                height="var(--spacing-9)"
                radius={3}
                index={1}
              />
              <Skeleton
                width="7rem"
                height="var(--spacing-9)"
                radius={3}
                index={1}
              />
              <Skeleton
                width="var(--spacing-9)"
                height="var(--spacing-9)"
                radius={3}
                index={1}
              />
            </HStack>
          </HStack>

          <VStack gap={4} hAlign="stretch">
            <HStack gap={3} vAlign="center">
              <Skeleton
                width="var(--spacing-9)"
                height="var(--spacing-9)"
                radius={2}
              />
              <Skeleton width="12rem" height="var(--spacing-4)" radius={2} />
              <Skeleton
                width="5rem"
                height="var(--spacing-6)"
                radius="rounded"
              />
            </HStack>
            <MetaJourneySkeleton label="hành trình vận chuyển" />
          </VStack>
        </VStack>
      </Card>

      <HStack gap={1.5} vAlign="center" wrap="wrap" xstyle={styles.tabs}>
        {TAB_WIDTHS.map((width, index) => (
          <Skeleton
            key={width}
            width={width}
            height="var(--spacing-9)"
            radius="rounded"
            index={index}
          />
        ))}
      </HStack>

      {tab === 'overview' ? <OverviewSkeleton /> : <TableSkeleton />}
    </VStack>
  );
}

/** Overview tab: 3 KPI cards, then field-tile sections. */
function OverviewSkeleton() {
  return (
    <>
      <Grid columns={{ minWidth: 300, max: 3 }} gap={5}>
        {KPI_CARDS.map((index) => (
          <Card key={index} padding={5} xstyle={styles.card}>
            <VStack gap={4} hAlign="stretch">
              <HStack hAlign="between" vAlign="center" gap={2}>
                <HStack gap={2} vAlign="center" xstyle={styles.grow}>
                  <Skeleton
                    width="var(--spacing-8)"
                    height="var(--spacing-8)"
                    radius={2}
                    index={index}
                  />
                  <Skeleton
                    width="60%"
                    height="var(--spacing-3)"
                    radius={2}
                    index={index}
                  />
                </HStack>
                <Skeleton
                  width="3rem"
                  height="var(--spacing-5)"
                  radius="rounded"
                  index={index}
                />
              </HStack>
              <Skeleton
                width="50%"
                height="calc(var(--spacing-10) + var(--spacing-2))"
                radius={2}
                index={index}
              />
              <HStack hAlign="between" vAlign="center" gap={2}>
                <Skeleton
                  width="45%"
                  height="var(--spacing-3)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="25%"
                  height="var(--spacing-3)"
                  radius={2}
                  index={index}
                />
              </HStack>
            </VStack>
          </Card>
        ))}
      </Grid>

      {SECTION_FIELD_COUNTS.map((fieldCount, section) => (
        <Card key={section} padding={6} xstyle={styles.card}>
          <VStack gap={6} hAlign="stretch">
            <HStack gap={3} vAlign="center" xstyle={styles.sectionHeader}>
              <Skeleton
                width="var(--spacing-9)"
                height="var(--spacing-9)"
                radius={2}
                index={section}
              />
              <Skeleton
                width="12rem"
                height="var(--spacing-5)"
                radius={2}
                index={section}
              />
            </HStack>
            <Grid columns={{ minWidth: 260, max: 3 }} gap={4}>
              {Array.from({ length: fieldCount }, (_, index) => (
                <VStack
                  key={index}
                  gap={3}
                  hAlign="stretch"
                  xstyle={styles.field}
                >
                  <Skeleton
                    width="40%"
                    height="var(--spacing-3)"
                    radius={2}
                    index={index}
                  />
                  <Skeleton
                    width="65%"
                    height="var(--spacing-5)"
                    radius={2}
                    index={index}
                  />
                </VStack>
              ))}
            </Grid>
          </VStack>
        </Card>
      ))}
    </>
  );
}

/** VGM / costs tab: one table card (title + rows). */
function TableSkeleton() {
  return (
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
              width="var(--spacing-1)"
              height="var(--spacing-6)"
              radius="rounded"
            />
            <Skeleton width="10rem" height="var(--spacing-5)" radius={2} />
            <Skeleton
              width="var(--spacing-7)"
              height="var(--spacing-5)"
              radius="rounded"
            />
          </HStack>
          <HStack gap={2} vAlign="center">
            <Skeleton width="7rem" height="var(--spacing-9)" radius={3} />
            <Skeleton width="8rem" height="var(--spacing-9)" radius={3} />
          </HStack>
        </HStack>
        {TABLE_ROWS.map((index) => (
          <HStack key={index} gap={6} vAlign="center" xstyle={styles.tableRow}>
            <Skeleton
              width="4%"
              height="var(--spacing-4)"
              radius={2}
              index={index}
            />
            <Skeleton
              width="18%"
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
              width="8%"
              height="var(--spacing-6)"
              radius="rounded"
              index={index}
            />
            <Skeleton
              width="14%"
              height="var(--spacing-4)"
              radius={2}
              index={index}
            />
            <Skeleton
              width="20%"
              height="var(--spacing-4)"
              radius={2}
              index={index}
            />
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  // Same hairline as `MetaShipmentHeaderCard`'s title row.
  titleRow: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-6)',
  },
  tabs: {
    paddingBlock: 'var(--spacing-0-5)',
  },
  grow: {
    flexGrow: 1,
  },
  sectionHeader: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-4)',
  },
  // `MetaShipmentField` tile frame.
  field: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
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
