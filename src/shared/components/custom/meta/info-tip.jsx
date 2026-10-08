'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Info } from 'lucide-react';

/**
 * "Meta" info tip: a small round accent-tinted "i" (solid accent on hover /
 * focus) that reveals a short card — an optional eyebrow, the title and an
 * optional secondary line. The lab `InfoTip` has no colour or content
 * hooks, so this composes Astryx `Tooltip` + `IconButton` the same way
 * (tap opens it on touch). E.g. the Vietnamese name of a LOG cost group.
 *
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   description?: string,
 *   label: string,
 * }} props `label` names the button for assistive tech.
 */
export function MetaInfoTip({ title, eyebrow, description, label }) {
  return (
    <Tooltip
      touchTrigger="tap"
      content={
        <VStack gap={0.5} xstyle={styles.content}>
          {eyebrow ? (
            <Text size="sm" weight="bold" color="inherit" xstyle={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : null}
          <Text weight="semibold" color="inherit">
            {title}
          </Text>
          {description ? (
            <Text size="sm" color="inherit" xstyle={styles.muted}>
              {description}
            </Text>
          ) : null}
        </VStack>
      }
    >
      <IconButton
        label={label}
        type="button"
        variant="ghost"
        size="sm"
        icon={<Icon icon={Info} size="xsm" color="inherit" />}
        xstyle={styles.trigger}
      />
    </Tooltip>
  );
}

const styles = stylex.create({
  trigger: {
    backgroundColor: {
      default: 'var(--meta-accent-tint-strong)',
      ':hover': 'var(--color-accent)',
      ':focus-visible': 'var(--color-accent)',
    },
    borderRadius: 'var(--radius-full)',
    color: {
      default: 'var(--color-accent)',
      ':hover': 'var(--color-on-accent)',
      ':focus-visible': 'var(--color-on-accent)',
    },
    height: 'var(--spacing-5)',
    minWidth: 0,
    padding: 0,
    transitionDuration: '120ms',
    transitionProperty: 'background-color, color',
    width: 'var(--spacing-5)',
  },
  content: {
    maxWidth: 'calc(var(--spacing-10) * 7)',
    paddingBlock: 'var(--spacing-0-5)',
  },
  eyebrow: {
    letterSpacing: '0.06em',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  muted: {
    opacity: 0.75,
  },
});
