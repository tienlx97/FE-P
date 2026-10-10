'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { PencilLine, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import { typedOrComputed } from '../config/edit-values.js';
import { formatVnd } from '../config/money.js';

const styles = stylex.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'var(--color-accent-muted)',
    },
    borderRadius: 'var(--radius-element)',
    borderStyle: 'none',
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    gap: 'var(--spacing-1)',
    lineHeight: 'inherit',
    marginInline: 'calc(-1 * var(--spacing-1))',
    outlineOffset: '2px',
    paddingBlock: 0,
    paddingInline: 'var(--spacing-1)',
    textAlign: 'inherit',
  },
  // Computed and editable: a dashed underline says "click me".
  value: {
    borderBottomColor: 'var(--color-border-emphasized)',
    borderBottomStyle: 'dashed',
    borderBottomWidth: 1,
  },
  // Typed by the user: accent colour and a solid underline.
  typed: {
    borderBottomColor: 'var(--color-accent)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    color: 'var(--color-text-accent)',
  },
  bold: { fontWeight: 'var(--font-weight-bold)' },
  tone: (/** @type {string} */ color) => ({ color }),
  form: { margin: 0, minWidth: 'calc(var(--spacing-10) * 7)' },
});

/**
 * A computed value the user may type over, right where it is shown: a
 * dashed underline marks it editable, a typed one is accent-coloured with a
 * pencil. Clicking opens a small editor with the computed value for
 * reference; "Lưu" stores the typed value (Enter), "Tự tính lại" goes back
 * to the computed one, Esc closes. Typing exactly the computed value also
 * means "computed". `text` is the shown value (e.g. "+10,800,000");
 * `toneColor` (a CSS colour) tints it while it is computed.
 * @param {{
 *   label: string,
 *   value: number,
 *   computed: number | undefined,
 *   isTyped: boolean,
 *   onSave: (typed: number | undefined) => Promise<{ success: boolean, message?: string }>,
 *   text: string,
 *   isBold?: boolean,
 *   toneColor?: string,
 * }} props
 */
export function QuickEditValue({
  label,
  value,
  computed,
  isTyped,
  onSave,
  text,
  isBold = false,
  toneColor,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(/** @type {number | undefined} */ (value));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  /** @param {boolean} open */
  function changeOpen(open) {
    if (open) {
      setDraft(value);
      setError('');
    }
    setIsOpen(open);
  }

  /** @param {number | undefined} typed */
  async function save(typed) {
    setIsSaving(true);
    setError('');
    const result = await onSave(typed);
    setIsSaving(false);
    if (result.success) setIsOpen(false);
    else setError(result.message ?? 'Không thể lưu thay đổi');
  }

  const content = (
    <form
      {...stylex.props(styles.form)}
      onSubmit={(event) => {
        event.preventDefault();
        if (draft !== undefined) save(typedOrComputed(draft, computed));
      }}
    >
      <VStack gap={2} hAlign="stretch">
        <FormattedNumberTextInput
          label={label}
          value={draft}
          onChange={setDraft}
          units="VND"
          placeholder={formatVnd(computed)}
          isDisabled={isSaving}
          status={error ? { type: 'error', message: error } : undefined}
          statusVariant="attached"
        />
        <Text color="secondary" size="sm">
          Tự tính: {formatVnd(computed)}
          {isTyped ? ' · đang dùng số sửa tay' : ''}
        </Text>
        <HStack gap={2} hAlign="end">
          {isTyped ? (
            <Button
              label="Tự tính lại"
              type="button"
              variant="ghost"
              size="sm"
              icon={<Icon icon={RotateCcw} size="sm" />}
              isDisabled={isSaving}
              onClick={() => save(undefined)}
            />
          ) : null}
          <Button
            label="Hủy"
            type="button"
            variant="secondary"
            size="sm"
            isDisabled={isSaving}
            onClick={() => setIsOpen(false)}
          />
          <Button
            label={isSaving ? 'Đang lưu…' : 'Lưu'}
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={isSaving || draft === undefined}
          />
        </HStack>
      </VStack>
    </form>
  );

  return (
    <Popover
      label={label}
      isOpen={isOpen}
      onOpenChange={changeOpen}
      content={content}
      alignment="end"
    >
      {(trigger) => (
        <button
          {...trigger}
          type="button"
          title={
            isTyped
              ? `Đã sửa tay · tự tính: ${formatVnd(computed)} — bấm để sửa`
              : 'Bấm để sửa'
          }
          aria-label={`${label}: ${text}${isTyped ? ' (đã sửa tay)' : ''}`}
          {...stylex.props(styles.trigger)}
        >
          {isTyped ? <Icon icon={PencilLine} size="sm" /> : null}
          <span
            {...stylex.props(
              isTyped ? styles.typed : styles.value,
              !isTyped && toneColor ? styles.tone(toneColor) : null,
              isBold && styles.bold,
            )}
          >
            {text}
          </span>
        </button>
      )}
    </Popover>
  );
}
