'use client';

import {
  editorStateJSONToMarkdown,
  markdownToEditorStateJSON,
  RichTextEditor,
  RichTextEditorAutoLinkPlugin,
  RichTextEditorToolbar,
} from '@astryxdesign/richtext';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { useRef, useState } from 'react';

/**
 * Markdown as the editor would write it back — used to tell a real edit
 * from the editor re-emitting what it was seeded with (plain-text notes
 * saved before rich text may normalize, e.g. escaped characters).
 * @param {string} markdown
 */
function normalizeMarkdown(markdown) {
  if (!markdown) return '';
  return editorStateJSONToMarkdown(markdownToEditorStateJSON(markdown));
}

/**
 * "Ghi chú" as rich text — the Astryx `RichTextEditor`
 * (`@astryxdesign/richtext`, canary) with a basic toolbar (bold, italic,
 * underline, strikethrough, code, lists, quote; no headings). The value is
 * Markdown, so plain-text notes saved earlier load unchanged and the
 * backend keeps storing a string. The editor is uncontrolled: `value`
 * seeds it on mount; remount it (`key`) to load a different note.
 * `maxLength` drives the counter, which counts plain text; the form schema
 * checks the Markdown length the API stores.
 *
 * Links: the toolbar's link button is off because its dialog renders a
 * `<form>` inside the editor, and every note field sits in a form (a
 * drawer / dialog) — nested forms are invalid HTML and its submit would
 * bubble to the outer form. URLs typed or pasted become links through the
 * auto-link plugin instead, and `[text](url)` works as a Markdown shortcut.
 * Underline has no Markdown syntax, so it does not survive saving.
 *
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (markdown: string) => void,
 *   placeholder?: string,
 *   isOptional?: boolean,
 *   isReadOnly?: boolean,
 *   isLabelHidden?: boolean,
 *   maxLength?: number,
 *   minHeight?: import('@astryxdesign/core/utils').SizeValue,
 *   status?: { type: 'error' | 'warning' | 'success', message?: string },
 *   statusVariant?: 'attached' | 'detached' | 'tooltip',
 * }} props
 */
export function RichTextNoteField({
  label,
  value,
  onChange,
  placeholder,
  isOptional = false,
  isReadOnly = false,
  isLabelHidden = false,
  maxLength,
  minHeight = '6rem',
  status,
  statusVariant,
}) {
  const [initialState] = useState(() =>
    value ? markdownToEditorStateJSON(value) : undefined,
  );
  const lastEmitted = useRef(/** @type {string | null} */ (null));

  return (
    <RichTextEditor
      label={label}
      isLabelHidden={isLabelHidden}
      defaultValue={initialState}
      placeholder={placeholder}
      isOptional={isOptional}
      isReadOnly={isReadOnly}
      maxLength={maxLength}
      minHeight={minHeight}
      width="100%"
      status={status}
      statusVariant={statusVariant}
      hasMarkdownShortcuts
      toolbar={
        isReadOnly ? undefined : (
          <RichTextEditorToolbar
            label="Định dạng ghi chú"
            headingLevels={[]}
            size="sm"
            hasLink={false}
          />
        )
      }
      plugins={<RichTextEditorAutoLinkPlugin />}
      onChange={(editorState) => {
        const markdown = editorState.read(() =>
          $convertToMarkdownString(TRANSFORMERS),
        );
        const previous = lastEmitted.current ?? normalizeMarkdown(value);
        if (markdown === previous) return;
        lastEmitted.current = markdown;
        onChange(markdown);
      }}
    />
  );
}
