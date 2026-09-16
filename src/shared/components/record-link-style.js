import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * Vivid blue + bold — shared "this cell links to another record's detail"
 * treatment (contract number, customer name, etc.), so every list marks a
 * cross-link the same way instead of each feature re-deriving its own
 * color choice. `Link`'s own `color` prop only offers the theme's accent
 * color (this app's brand green); `--color-icon-blue` (the vivid,
 * un-themed base accent) is applied via `xstyle` instead, matching a
 * reference report where record codes render as blue link text.
 */
export const recordLinkStyles = stylex.create({
  link: {
    color: colorVars['--color-icon-blue'],
    fontWeight: 'bold',
  },
});
