'use client';

import { MetadataListItem } from '@astryxdesign/core/MetadataList';
import {
  borderVars,
  colorVars,
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

// A single --border-width (1px) round-trips through the ~0.6x display
// scale this app is usually viewed at and anti-aliases into a broken,
// dashed-looking line — doubling it keeps the accent outline solid at
// that scale. Shared by expandedRow/expandedPanel so the two segments'
// widths always match at the seam.
const EXPANDED_BORDER_WIDTH = `calc(${borderVars['--border-width']} * 2)`;

/**
 * Shared visual treatment for a `useTableRowExpansion` teaser row + its
 * detail panel: a clickable row, an accent outline that marks which row is
 * currently expanded, and the bleed trick that repaints the panel's
 * hardcoded muted background back to a normal surface. Extracted from the
 * Hợp đồng (contracts) list so every expandable list gets the same look.
 */
export const expandableRowStyles = stylex.create({
  clickableRow: {
    cursor: 'pointer',
  },
  // Border-only cue instead of a background wash — an accent outline around
  // the teaser row (top/left/right; the bottom edge is left open so it
  // visually continues into the detail panel's own border below) marks the
  // row as "this is the one that's expanded" without tinting its background.
  expandedRow: {
    borderBottomWidth: 0,
    borderColor: colorVars['--color-accent'],
    borderLeftWidth: EXPANDED_BORDER_WIDTH,
    borderRightWidth: EXPANDED_BORDER_WIDTH,
    borderStyle: 'solid',
    borderTopWidth: EXPANDED_BORDER_WIDTH,
  },
  // useTableRowExpansion's detail `<tr>` ships a hardcoded
  // `background-color: var(--color-background-muted)` with no prop to
  // override it. This wrapper bleeds out to the `<td>`'s own edges
  // (cancelling its padding-block/padding-inline with matching negative
  // margins) and repaints an opaque surface background over the muted one,
  // then continues the teaser row's accent border down the left/right/
  // bottom edges so the two rows read as one outlined panel.
  expandedPanel: {
    backgroundColor: colorVars['--color-background-surface'],
    borderBottomColor: colorVars['--color-accent'],
    borderBottomStyle: 'solid',
    borderBottomWidth: EXPANDED_BORDER_WIDTH,
    borderLeftColor: colorVars['--color-accent'],
    borderLeftStyle: 'solid',
    borderLeftWidth: EXPANDED_BORDER_WIDTH,
    borderRightColor: colorVars['--color-accent'],
    borderRightStyle: 'solid',
    borderRightWidth: EXPANDED_BORDER_WIDTH,
    marginBlock: `calc(${spacingVars['--spacing-4']} * -1)`,
    marginInline: `calc(${spacingVars['--spacing-5']} * -1)`,
    paddingBlock: spacingVars['--spacing-4'],
    paddingInline: spacingVars['--spacing-5'],
  },
  // A flat square instead of Card's border/elevation — this is a document
  // glyph slot, not a self-contained interactive item.
  expandedIcon: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-element'],
    color: colorVars['--color-icon-secondary'],
    flexShrink: 0,
    height: spacingVars['--spacing-10'],
    width: spacingVars['--spacing-10'],
  },
  // A hairline under the value, like a read-only input field — per user
  // request (2026-09-03) that MetadataListItem values in these expanded
  // panels read as input-style fields instead of bare key/value text.
  metadataListItemUnderline: {
    borderBottomColor: colorVars['--color-border'],
    borderBottomStyle: 'solid',
    borderBottomWidth: borderVars['--border-width'],
    paddingBottom: spacingVars['--spacing-1'],
  },
});

/**
 * `MetadataListItem` with the shared underline treatment baked in — a drop-in
 * replacement wherever a contract/customer/shipment expanded panel renders
 * metadata fields, so every such panel gets the same input-like look without
 * repeating the `xstyle` at each call site.
 * @param {import('@astryxdesign/core/MetadataList').MetadataListItemProps} props
 */
export function UnderlinedMetadataListItem(props) {
  return (
    <MetadataListItem
      {...props}
      xstyle={expandableRowStyles.metadataListItemUnderline}
    />
  );
}

/**
 * Builds the `transformBodyRow` plugin that makes a table row clickable to
 * toggle expansion and paints the accent outline on whichever row is
 * currently expanded. Pair with `useTableRowExpansion` (same
 * `expandedId`/`onToggle`) so click-anywhere-on-row and the chevron button
 * stay in sync.
 * @template {{ id: string }} T
 * @param {{
 *   expandedId: string | null,
 *   onToggle: (id: string) => void,
 *   isExpandable?: (row: T) => boolean,
 * }} config
 * @returns {import('@astryxdesign/core/Table').TablePlugin<T>}
 */
export function createRowExpansionInteractionPlugin({
  expandedId,
  onToggle,
  isExpandable = () => true,
}) {
  return {
    transformBodyRow: (props, row) => {
      if (!isExpandable(row)) {
        return props;
      }

      const toggle = () => onToggle(row.id);

      return {
        ...props,
        htmlProps: {
          ...props.htmlProps,
          'aria-expanded': expandedId === row.id,
          tabIndex: 0,
          onClick: (event) => {
            props.htmlProps.onClick?.(event);
            if (!event.defaultPrevented) {
              toggle();
            }
          },
          onKeyDown: (event) => {
            props.htmlProps.onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              event.target === event.currentTarget &&
              (event.key === 'Enter' || event.key === ' ')
            ) {
              event.preventDefault();
              toggle();
            }
          },
        },
        xstyle: [
          ...props.xstyle,
          expandableRowStyles.clickableRow,
          expandedId === row.id && expandableRowStyles.expandedRow,
        ],
      };
    },
  };
}
