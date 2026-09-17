'use client';

import { Token } from '@astryxdesign/core/Token';

/**
 * "IBM Plex Corporate" chip — Astryx has no component literally named
 * "Chip"; `Token` ("a small, inline element for representing discrete
 * pieces of associated data" — tags, categories, filters) is the closest
 * match (confirmed via `astryx search Chip`, which surfaces `Token` as
 * the top result). Defaults `color` to `'gray'` per the spec: "Chips:
 * compact tagging elements utilizing secondary and neutral tones."
 * @param {import('@astryxdesign/core/Token').TokenProps} props
 */
export function IbmPlexChip({ color = 'gray', ...props }) {
  return <Token color={color} {...props} />;
}
