'use client';

import { Markdown } from '@astryxdesign/core/Markdown';
import { Text } from '@astryxdesign/core/Text';

/**
 * Read-only "Ghi chú" for tables and detail views: the Markdown written by
 * `RichTextNoteField` rendered with Astryx `Markdown` (compact spacing,
 * full cell width). Plain-text notes render as a paragraph; an empty note
 * shows "—". Links open in a new tab.
 * @param {{ value: string | null | undefined }} props
 */
export function RichTextNote({ value }) {
  if (!value || !value.trim()) return <Text color="secondary">—</Text>;
  return (
    <Markdown
      density="compact"
      contentWidth="100%"
      onLinkClick={(href) => {
        window.open(href, '_blank', 'noopener,noreferrer');
        return false;
      }}
    >
      {value}
    </Markdown>
  );
}
