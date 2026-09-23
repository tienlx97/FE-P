'use client';

import { fontWeightVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

import { TextInput } from '@/shared/components/text-input.jsx';

// const contractCodeTypography = stylex.createTheme(
//   typographyVars,
//   /** @type {any} */ (
//     {
//       // '--font-family-body': 'var(--maritime-contract-code-font)',
//     }
//   ),
// );

// const contractCodeTypeScale = stylex.createTheme(
//   typeScaleVars,
//   /** @type {any} */ ({
//     '--text-body-size': '14px',
//     '--text-body-leading': '20px',
//   }),
// );

const styles = stylex.create({
  value: {
    fontWeight: fontWeightVars['--font-weight-bold'],
  },
});

/**
 * Thin Astryx adapter for contract identifiers. The published TextInput keeps
 * ownership of behavior, accessibility and validation; this component only
 * scopes the desktop contract-detail data typography to the control through
 * StyleX token themes.
 * @param {import('react').ComponentProps<typeof TextInput>} props
 */
export function MaritimeContractCodeTextInput({ xstyle, ...props }) {
  return (
    <TextInput
      {...props}
      xstyle={[
        // contractCodeTypography,
        // contractCodeTypeScale,
        styles.value,
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
      ]}
    />
  );
}
