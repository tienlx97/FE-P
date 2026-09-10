import { Grid } from '@astryxdesign/core/Grid';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, radiusVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import {
  daysWithEntries,
  monthGridCells,
  monthLabel,
  weekdayLabels,
} from '../api/calendar.js';

const styles = stylex.create({
  root: {
    flexShrink: 0,
    width: '100%',
  },
  cell: {
    paddingBlock: 'var(--spacing-1)',
  },
  headCell: {
    paddingBlock: 'var(--spacing-1)',
  },
  dayHasEntry: {
    backgroundColor: colorVars['--color-accent'],
    borderRadius: radiusVars['--radius-full'],
    color: colorVars['--color-on-accent'],
  },
});

/**
 * A single month grid, days that have an entry (from `entries`, e.g.
 * upcoming events) highlighted as solid accent circles. Flattens
 * `monthGridCells` straight into one 7-column `Grid` — header labels and
 * day cells share the same grid so column widths always agree, which
 * nested per-row `HStack`s would not guarantee.
 *
 * Deliberately has no "today" marker: computing "today" needs
 * `Date.now()`, which differs between server render time and the visitor's
 * clock and would hydration-mismatch. See `api/calendar.js`.
 *
 * @param {{
 *   year: number,
 *   month: number,
 *   entries: { date: string }[],
 * }} props
 */
export function MiniCalendar({ year, month, entries }) {
  const cells = monthGridCells(year, month);
  const highlighted = daysWithEntries(entries, year, month);

  return (
    <VStack gap={3} xstyle={styles.root}>
      <Heading level={3}>{monthLabel(year, month)}</Heading>
      <Grid columns={7} gap={1}>
        {weekdayLabels().map((label) => (
          <VStack
            key={label}
            hAlign="center"
            vAlign="center"
            xstyle={styles.headCell}
          >
            <Text type="supporting" color="secondary" weight="bold">
              {label}
            </Text>
          </VStack>
        ))}
        {cells.map((day, index) => (
          <VStack
            key={index}
            hAlign="center"
            vAlign="center"
            xstyle={[
              styles.cell,
              day != null && highlighted.has(day) && styles.dayHasEntry,
            ]}
          >
            {day != null ? (
              <Text
                type="supporting"
                color={highlighted.has(day) ? 'inherit' : 'primary'}
                weight={highlighted.has(day) ? 'bold' : 'normal'}
              >
                {day}
              </Text>
            ) : null}
          </VStack>
        ))}
      </Grid>
    </VStack>
  );
}
