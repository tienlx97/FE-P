'use client';

import { Card } from '@astryxdesign/core/Card';
import {
  borderVars,
  colorVars,
  radiusVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * Reusable Maritime card based on Astryx Card. Use it for discrete form
 * entities (a party, account, or signature state), not for page sections.
 * @param {import('react').ComponentProps<typeof Card> & {
 *   tone?: 'default' | 'accent',
 * }} props
 */
export function MaritimeCard({ tone = 'default', xstyle, ...props }) {
  return (
    <Card
      {...props}
      elevation="none"
      xstyle={[
        styles.base,
        toneStyles[tone],
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
      ]}
    />
  );
}

const styles = stylex.create({
  base: {
    backgroundColor: colorVars['--color-background-surface'],
    borderColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-inner'],
    borderStyle: 'solid',
    borderWidth: borderVars['--border-width'],
  },
});

const toneStyles = stylex.create({
  default: {},
  accent: {
    borderColor: 'var(--maritime-card-accent-border)',
  },
});
