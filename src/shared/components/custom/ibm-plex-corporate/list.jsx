'use client';

import { List, ListItem } from '@astryxdesign/core/List';

/**
 * "IBM Plex Corporate" list — per the spec: "Clean, structured row
 * layouts with generous padding and clear typographic hierarchy." Astryx's
 * own `List`/`ListItem` already draw edge-to-edge rows with dividers and
 * typographic slots (title/description/icon/badge) — re-exported here,
 * unmodified, so callers import every "IBM Plex Corporate" component from
 * one place instead of mixing this folder with raw `@astryxdesign/core`
 * imports.
 */
export { List as IbmPlexList, ListItem as IbmPlexListItem };
