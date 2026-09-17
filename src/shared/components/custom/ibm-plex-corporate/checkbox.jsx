'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';

/**
 * "IBM Plex Corporate" checkbox — per the spec: "Precise geometric
 * indicators adhering to the soft roundedness scale." `CheckboxInput`'s
 * own box already follows the theme's radius scale automatically (no
 * `components` override needed for it, unlike Button/Card) — this
 * wrapper exists so call sites import from one place alongside the rest
 * of this folder.
 * @param {import('@astryxdesign/core/CheckboxInput').CheckboxInputProps} props
 */
export function IbmPlexCheckboxInput(props) {
  return <CheckboxInput {...props} />;
}
