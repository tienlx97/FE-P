'use client';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Popover } from '@astryxdesign/core/Popover';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Section } from '@astryxdesign/core/Section';
import { StackItem } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { AlignJustify, Pin } from 'lucide-react';
import { useState } from 'react';

import { TableColumnsPanel } from './table-columns-panel.jsx';

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Gọn' },
  { value: 'balanced', label: 'Vừa' },
  { value: 'spacious', label: 'Rộng' },
];

const STICKY_START_OPTIONS = [
  { value: 'none', label: 'Không ghim' },
  { value: 'one', label: 'Cột đầu tiên' },
  { value: 'two', label: 'Hai cột đầu tiên' },
];

const STICKY_END_OPTIONS = [
  { value: 'none', label: 'Không ghim' },
  { value: 'one', label: 'Cột cuối cùng' },
  { value: 'two', label: 'Hai cột cuối cùng' },
];

const SECTIONS = [
  { key: 'columns', label: 'Cột hiển thị', title: 'Cột hiển thị' },
  { key: 'density', label: 'Mật độ dòng', title: 'Mật độ dòng' },
  { key: 'sticky', label: 'Ghim cột', title: 'Ghim cột' },
];

const styles = stylex.create({
  // Flush like the popover this pattern is drawn from: the rail's divider
  // then runs the full height of the body, and the rail/pane each restate
  // their own gutter instead of sharing the popover's.
  surface: {
    backgroundColor: colorVars['--color-background-surface'],
    maxWidth: `calc(100vw - ${spacingVars['--spacing-4']})`,
    paddingBlockEnd: 0,
    paddingBlockStart: 0,
    paddingInlineEnd: 0,
    paddingInlineStart: 0,
  },
  body: {
    blockSize: 400,
    flexDirection: {
      default: 'column',
      '@media (min-width: 640px)': 'row',
    },
  },
  rail: {
    flexShrink: 0,
    width: {
      default: '100%',
      '@media (min-width: 640px)': 176,
    },
  },
  railItems: {
    flexDirection: {
      default: 'row',
      '@media (min-width: 640px)': 'column',
    },
    flexWrap: 'wrap',
  },
  railItem: {
    justifyContent: 'flex-start',
    width: {
      default: 'auto',
      '@media (min-width: 640px)': '100%',
    },
  },
  paneSlot: {
    flexBasis: 0,
    minHeight: 0,
    minWidth: 0,
  },
  // `pane` sits in a `StackItem`, which is a block box, not a flex
  // container — `flexGrow` does nothing there, so without a definite
  // height this sizes to its content instead of the popover's fixed
  // `body` height, and every `overflowY: auto` below it has nothing to
  // clip against.
  pane: {
    blockSize: '100%',
    minWidth: 0,
  },
});

/**
 * Computes which column keys land on a pinned edge, given the edge setting
 * and the table's current (visible, ordered) column keys — the contiguous
 * run from that edge inward. Shared by every list that offers sticky
 * columns through {@link TableViewOptionsPopover}, so the popover's choice
 * and the `useTableStickyColumns` call agree on what "first/last column(s)"
 * means.
 * @param {'none' | 'one' | 'two'} edge
 * @param {readonly string[]} columnKeys
 * @param {boolean} fromEnd
 * @returns {string[]}
 */
export function stickyColumnKeys(edge, columnKeys, fromEnd) {
  const count = edge === 'two' ? 2 : edge === 'one' ? 1 : 0;
  // Pinning every column leaves nothing to scroll under the pinned edge's
  // shadow, but the pinned cell still renders its shadow ::after — which
  // bleeds past the table's own width and trips the scroll wrapper's
  // `overflow: auto` into showing a scrollbar with nothing to scroll. Cap
  // the sticky run so at least one column stays unpinned.
  if (count === 0 || columnKeys.length <= count) {
    return [];
  }
  return fromEnd ? columnKeys.slice(-count) : columnKeys.slice(0, count);
}

/**
 * Consolidated "View options" trigger: columns, row density, and sticky
 * columns behind one popover with a section rail, instead of three separate
 * toolbar controls. Mirrors the reference table template's View options
 * panel (rail + pane), scoped to the sections this project's tables
 * actually use — no saved-view grouping section, since these lists have no
 * grouping feature.
 *
 * The Columns section mirrors the template's two-panel transfer list
 * (Displayed / Available) rather than a single checkbox list: these tables
 * load rows with many fields, and a flat checkbox list of a dozen-plus
 * columns is harder to scan than seeing what's on and what's off at a
 * glance, with drag-to-reorder available on the displayed side.
 * @param {{
 *   columns: ReadonlyArray<{ key: string, label: string, isAlwaysVisible?: boolean }>,
 *   activeColumnKeys: string[],
 *   onChangeActiveColumnKeys: (keys: string[]) => void,
 *   defaultColumnKeys?: string[],
 *   fixedEndLabel?: string,
 *   density: string,
 *   onChangeDensity: (value: string) => void,
 *   stickyStart: string,
 *   onChangeStickyStart: (value: string) => void,
 *   stickyEnd: string,
 *   onChangeStickyEnd: (value: string) => void,
 * }} props
 */
export function TableViewOptionsPopover({
  columns,
  activeColumnKeys,
  onChangeActiveColumnKeys,
  defaultColumnKeys,
  fixedEndLabel,
  density,
  onChangeDensity,
  stickyStart,
  onChangeStickyStart,
  stickyEnd,
  onChangeStickyEnd,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState(
    /** @type {'columns' | 'density' | 'sticky'} */ ('columns'),
  );
  const activeSection = SECTIONS.find((item) => item.key === section);

  return (
    <Popover
      placement="below"
      alignment="end"
      width={`min(42.5rem, calc(100vw - ${spacingVars['--spacing-4']}))`}
      label="Tuỳ chọn hiển thị"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      xstyle={styles.surface}
      content={
        <HStack gap={0} xstyle={styles.body}>
          <Section
            variant="transparent"
            padding={1}
            dividers={['end']}
            xstyle={styles.rail}
          >
            <VStack gap={1} xstyle={styles.railItems}>
              <Button
                label="Cột hiển thị"
                variant={section === 'columns' ? 'secondary' : 'ghost'}
                icon={<Icon icon="viewColumns" size="sm" />}
                xstyle={styles.railItem}
                onClick={() => setSection('columns')}
              />
              <Button
                label="Mật độ dòng"
                variant={section === 'density' ? 'secondary' : 'ghost'}
                icon={<Icon icon={AlignJustify} size="sm" />}
                xstyle={styles.railItem}
                onClick={() => setSection('density')}
              />
              <Button
                label="Ghim cột"
                variant={section === 'sticky' ? 'secondary' : 'ghost'}
                icon={<Icon icon={Pin} size="sm" />}
                xstyle={styles.railItem}
                onClick={() => setSection('sticky')}
              />
            </VStack>
          </Section>

          <StackItem size="fill" xstyle={styles.paneSlot}>
            <VStack gap={0} minHeight={0} xstyle={styles.pane}>
              {fixedEndLabel ? (
                <VStack padding={4}>
                  <Text color="secondary">
                    Cột {fixedEndLabel} luôn hiển thị và ghim ở cuối bảng.
                  </Text>
                </VStack>
              ) : null}
              {section !== 'columns' ? (
                <VStack gap={0} padding={4} paddingBlockEnd={3}>
                  <Heading level={3}>{activeSection?.title}</Heading>
                </VStack>
              ) : null}

              {section === 'columns' ? (
                <TableColumnsPanel
                  columns={columns}
                  activeColumnKeys={activeColumnKeys}
                  onChangeActiveColumnKeys={onChangeActiveColumnKeys}
                  defaultColumnKeys={defaultColumnKeys}
                />
              ) : null}

              {section === 'density' ? (
                <VStack gap={0} paddingInline={4} paddingBlockEnd={4}>
                  <RadioList
                    label="Mật độ dòng"
                    isLabelHidden
                    value={density}
                    onChange={onChangeDensity}
                  >
                    {DENSITY_OPTIONS.map((option) => (
                      <RadioListItem
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
                    ))}
                  </RadioList>
                </VStack>
              ) : null}

              {section === 'sticky' ? (
                <VStack gap={4} paddingInline={4} paddingBlockEnd={4}>
                  <RadioList
                    label="Ghim từ đầu bảng"
                    value={stickyStart}
                    onChange={onChangeStickyStart}
                  >
                    {STICKY_START_OPTIONS.map((option) => (
                      <RadioListItem
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
                    ))}
                  </RadioList>
                  <RadioList
                    label="Ghim từ cuối bảng"
                    value={stickyEnd}
                    onChange={onChangeStickyEnd}
                  >
                    {STICKY_END_OPTIONS.map((option) => (
                      <RadioListItem
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
                    ))}
                  </RadioList>
                </VStack>
              ) : null}
            </VStack>
          </StackItem>
        </HStack>
      }
    >
      <Button
        label="Tuỳ chọn hiển thị"
        variant="ghost"
        size="sm"
        endContent={<Icon icon="chevronDown" size="sm" />}
      />
    </Popover>
  );
}
