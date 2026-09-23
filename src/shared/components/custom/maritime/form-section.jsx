'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import {
  borderVars,
  colorVars,
  radiusVars,
  spacingVars,
  typeScaleVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

const formSectionSupportingType = stylex.createTheme(
  typeScaleVars,
  /** @type {any} */ ({
    '--text-supporting-size': 'var(--maritime-form-section-title-size)',
    '--text-supporting-leading': 'var(--maritime-form-section-title-leading)',
  }),
);

/**
 * Reusable Maritime form group based on Astryx Section. It owns the numbered
 * Figma header, blue wash, border and spacing so feature forms do not copy the
 * visual contract with local styles.
 * @param {{
 *   index: number,
 *   title: string,
 *   meta?: string,
 *   metaTone?: 'default' | 'success' | 'error',
 *   icon: import('lucide-react').LucideIcon,
 *   children: import('react').ReactNode,
 *   xstyle?: import('@stylexjs/stylex').StyleXStyles,
 * }} props
 */
export function MaritimeFormSection({
  index,
  title,
  meta,
  metaTone = 'default',
  icon,
  children,
  xstyle,
}) {
  return (
    <Section
      variant="transparent"
      padding={4}
      xstyle={[
        styles.section,
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
      ]}
    >
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3} xstyle={styles.header}>
          <HStack gap={2} vAlign="center">
            <Icon icon={icon} size="md" xstyle={styles.icon} />
            <Text
              as="h3"
              size="base"
              type="supporting"
              weight="bold"
              color="primary"
              xstyle={
                /** @type {any} */ ([
                  // formSectionSupportingType,

                  styles.eyebrow,
                ])
              }
            >
              {index}. {title}
            </Text>
          </HStack>
          {meta ? (
            <Text
              type="supporting"
              color="secondary"
              xstyle={
                /** @type {any} */ ([
                  formSectionSupportingType,
                  styles.meta,
                  metaToneStyles[metaTone],
                ])
              }
            >
              {meta}
            </Text>
          ) : null}
        </HStack>
        {children}
      </VStack>
    </Section>
  );
}

const styles = stylex.create({
  section: {
    backgroundColor:
      'color-mix(in srgb, var(--maritime-badge-info-bg) 70%, transparent)',
    borderColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-element'],
    borderStyle: 'solid',
    borderWidth: borderVars['--border-width'],
    margin: 0,
    maxWidth: '100%',
    width: '100%',
  },
  header: {
    borderBottomColor: colorVars['--color-border'],
    borderBottomStyle: 'solid',
    borderBottomWidth: borderVars['--border-width'],
    paddingBottom: spacingVars['--spacing-2'],
  },
  icon: {
    color: colorVars['--color-accent'],
  },
  eyebrow: {
    fontSize: 'var(--maritime-form-section-title-size)',
    letterSpacing: 'var(--maritime-form-section-title-tracking)',
    lineHeight: 'var(--maritime-form-section-title-leading)',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 'var(--maritime-form-section-meta-size)',
    lineHeight: 'var(--maritime-form-section-title-leading)',
  },
});

const metaToneStyles = stylex.create({
  default: {},
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    borderColor: 'var(--maritime-badge-success-border)',
    borderRadius: 'var(--maritime-form-section-status-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--maritime-badge-success-text)',
    fontWeight: 'var(--font-weight-bold)',
    paddingBlock: 'var(--maritime-form-section-status-padding-block)',
    paddingInline: 'var(--maritime-form-section-status-padding-inline)',
  },
  error: {
    backgroundColor: 'var(--maritime-badge-error-bg)',
    borderColor: 'var(--maritime-badge-error-border)',
    borderRadius: 'var(--maritime-form-section-status-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--maritime-badge-error-text)',
    fontWeight: 'var(--font-weight-bold)',
    paddingBlock: 'var(--maritime-form-section-status-padding-block)',
    paddingInline: 'var(--maritime-form-section-status-padding-inline)',
  },
});
