'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Boxes,
  ClipboardList,
  Container,
  Hammer,
  ListPlus,
  Lock,
  Pencil,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'accent' | 'success' | 'indigo' | 'neutral'} MetaBoqTone
 * @typedef {{ label: string, value: string, unit?: string, note?: string, tone: MetaBoqTone, icon: import('lucide-react').LucideIcon }} MetaBoqKpi
 * @typedef {{ label: string, value: string, isTotal?: boolean }} MetaBoqRow
 * @typedef {{ label: string, value: string, share: number }} MetaBoqBar
 */

const KPI_COLUMNS = { minWidth: 220, max: 4 };
const CARD_COLUMNS = { minWidth: 320, max: 3 };

/**
 * "BOQ" tab of the contract detail page, in the Meta theme (no Figma frame:
 * composed from the Meta tab language — KPI cards like "Hoa hồng", inset
 * key-value rows, thin share bars like "Tiến độ thanh toán"). Purely
 * presentational: the feature layer formats every value and owns editing
 * (`onEdit`). Composed from Astryx components only (golden rule #15).
 *
 * @param {{
 *   isLoading?: boolean,
 *   isEmpty?: boolean,
 *   sentDateLabel?: string,
 *   kpis: MetaBoqKpi[],
 *   logisticsRows: MetaBoqRow[],
 *   unitCostBars: MetaBoqBar[],
 *   unitCostTotal: string,
 *   volumeBars: MetaBoqBar[],
 *   extraFields: MetaBoqRow[],
 *   editLabel: string,
 *   onEdit: () => void,
 * }} props
 */
export function MetaBoqPanel({
  isLoading = false,
  isEmpty = false,
  sentDateLabel,
  kpis,
  logisticsRows,
  unitCostBars,
  unitCostTotal,
  volumeBars,
  extraFields,
  editLabel,
  onEdit,
}) {
  if (isLoading) return <MetaBoqSkeleton />;

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
        <HStack gap={3} vAlign="center" wrap="wrap">
          <Heading level={3}>Bảng khối lượng & chi phí (BOQ)</Heading>
          <MetaPill label="Nội bộ · Bảo mật" tone="neutral" icon={Lock} />
          {sentDateLabel ? (
            <MetaPill label={`Đã gửi BOQ ${sentDateLabel}`} tone="success" />
          ) : (
            <MetaPill label="Chưa gửi BOQ" tone="muted" />
          )}
        </HStack>
        <Button
          label={editLabel}
          variant={isEmpty ? 'primary' : 'secondary'}
          icon={<Icon icon={isEmpty ? ListPlus : Pencil} size="sm" />}
          onClick={onEdit}
        />
      </HStack>

      {isEmpty ? (
        <Card padding={8} xstyle={styles.card}>
          <VStack gap={3} hAlign="center">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={[styles.bubbleLg, bubbleTones.accent]}
            >
              <Icon icon={ClipboardList} size="lg" color="inherit" />
            </HStack>
            <Heading level={4}>Chưa có dữ liệu BOQ</Heading>
            <Text color="secondary" justify="center">
              Nhập số cont, giá vốn / giá báo, đơn giá vốn, khối lượng và lợi
              nhuận để theo dõi hiệu quả hợp đồng.
            </Text>
            <Button
              label={editLabel}
              variant="primary"
              icon={<Icon icon={ListPlus} size="sm" />}
              onClick={onEdit}
            />
          </VStack>
        </Card>
      ) : (
        <>
          <Grid columns={KPI_COLUMNS} gap={3}>
            {kpis.map((kpi) => (
              <MetaBoqKpiCard key={kpi.label} kpi={kpi} />
            ))}
          </Grid>

          <Grid columns={CARD_COLUMNS} gap={3} xstyle={styles.alignStart}>
            <MetaBoqCard icon={Container} tone="accent" title="Logistics">
              <VStack gap={0} hAlign="stretch">
                {logisticsRows.map((row) => (
                  <MetaBoqKeyValue key={row.label} row={row} />
                ))}
              </VStack>
            </MetaBoqCard>

            <MetaBoqCard
              icon={Hammer}
              tone="indigo"
              title="Đơn giá vốn"
              meta={unitCostTotal}
            >
              <MetaBoqBars bars={unitCostBars} tone="indigo" />
            </MetaBoqCard>

            <MetaBoqCard icon={Boxes} tone="success" title="Khối lượng">
              <MetaBoqBars bars={volumeBars} tone="success" />
            </MetaBoqCard>
          </Grid>

          {extraFields.length > 0 ? (
            <MetaBoqCard icon={ListPlus} tone="neutral" title="Trường tùy ý">
              <Grid columns={CARD_COLUMNS} gap={3}>
                {extraFields.map((row) => (
                  <VStack
                    key={row.label}
                    gap={1}
                    hAlign="stretch"
                    xstyle={styles.inset}
                  >
                    <Text size="sm" color="secondary">
                      {row.label}
                    </Text>
                    <Text weight="semibold">{row.value}</Text>
                  </VStack>
                ))}
              </Grid>
            </MetaBoqCard>
          ) : null}
        </>
      )}
    </VStack>
  );
}

/** @param {{ kpi: MetaBoqKpi }} props */
function MetaBoqKpiCard({ kpi }) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2} wrap="nowrap">
          <Text
            size="sm"
            weight="semibold"
            color="secondary"
            xstyle={styles.caps}
          >
            {kpi.label}
          </Text>
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[styles.bubble, bubbleTones[kpi.tone]]}
          >
            <Icon icon={kpi.icon} size="sm" color="inherit" />
          </HStack>
        </HStack>
        <HStack gap={1} vAlign="end" wrap="wrap">
          <Text
            size="2xl"
            weight="bold"
            hasTabularNumbers
            xstyle={styles.figure}
          >
            {kpi.value}
          </Text>
          {kpi.unit ? (
            <Text size="sm" weight="semibold" color="secondary">
              {kpi.unit}
            </Text>
          ) : null}
        </HStack>
        {kpi.note ? (
          <Text size="sm" color="secondary" maxLines={2}>
            {kpi.note}
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

/**
 * @param {{
 *   icon: import('lucide-react').LucideIcon,
 *   tone: MetaBoqTone,
 *   title: string,
 *   meta?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
function MetaBoqCard({ icon, tone, title, meta, children }) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={3} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={2}
          wrap="wrap"
          xstyle={styles.cardHeader}
        >
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={[styles.bubble, bubbleTones[tone]]}
            >
              <Icon icon={icon} size="sm" color="inherit" />
            </HStack>
            <Heading level={4}>{title}</Heading>
          </HStack>
          {meta ? (
            <Text size="sm" weight="bold" hasTabularNumbers>
              {meta}
            </Text>
          ) : null}
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

/** @param {{ row: MetaBoqRow }} props */
function MetaBoqKeyValue({ row }) {
  return (
    <HStack
      hAlign="between"
      vAlign="center"
      gap={3}
      wrap="nowrap"
      xstyle={[styles.kvRow, row.isTotal && styles.kvTotal]}
    >
      <Text
        size="sm"
        color={row.isTotal ? 'primary' : 'secondary'}
        weight={row.isTotal ? 'bold' : 'normal'}
      >
        {row.label}
      </Text>
      <Text
        weight={row.isTotal ? 'bold' : 'semibold'}
        color={row.isTotal ? 'accent' : 'primary'}
        hasTabularNumbers
      >
        {row.value}
      </Text>
    </HStack>
  );
}

/** @param {{ bars: MetaBoqBar[], tone: MetaBoqTone }} props */
function MetaBoqBars({ bars, tone }) {
  return (
    <VStack gap={3} hAlign="stretch">
      {bars.map((bar) => (
        <VStack key={bar.label} gap={1} hAlign="stretch">
          <HStack hAlign="between" vAlign="center" gap={2} wrap="nowrap">
            <Text size="sm" color="secondary">
              {bar.label}
            </Text>
            <Text size="sm" weight="semibold" hasTabularNumbers>
              {bar.value}
            </Text>
          </HStack>
          <HStack wrap="nowrap" xstyle={styles.track}>
            <HStack
              as="span"
              xstyle={[
                styles.fill(`${Math.min(100, Math.max(0, bar.share))}%`),
                fillTones[tone],
              ]}
            />
          </HStack>
        </VStack>
      ))}
    </VStack>
  );
}

function MetaBoqSkeleton() {
  return (
    <VStack gap={4} hAlign="stretch">
      <Skeleton height={32} width={360} />
      <Grid columns={KPI_COLUMNS} gap={3}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} height={132} />
        ))}
      </Grid>
      <Grid columns={CARD_COLUMNS} gap={3}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} height={260} />
        ))}
      </Grid>
    </VStack>
  );
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
    minWidth: 0,
  },
  alignStart: {
    alignItems: 'start',
  },
  caps: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  figure: {
    lineHeight: 1.1,
  },
  bubble: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  bubbleLg: {
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-12)',
    width: 'var(--spacing-12)',
  },
  cardHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-3)',
  },
  kvRow: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-2)',
  },
  kvTotal: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderBottomColor: 'transparent',
    borderRadius: 'var(--radius-element)',
    marginTop: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
  inset: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  track: {
    backgroundColor: 'var(--meta-hairline)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-1-5)',
    overflow: 'hidden',
  },
  fill: (/** @type {string} */ width) => ({
    borderRadius: 'var(--radius-full)',
    height: '100%',
    width,
  }),
});

const bubbleTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo)',
  },
  neutral: {
    backgroundColor: 'var(--meta-hairline)',
    color: 'var(--color-text-secondary)',
  },
});

const fillTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  neutral: { backgroundColor: 'var(--color-text-secondary)' },
});
