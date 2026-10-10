'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { MetaFormCard } from '@/shared/components/custom/meta/index.js';

import { formatVnd } from '../config/money.js';
import { QuickEditValue } from './quick-edit-value.jsx';

/**
 * The drawers' computed value (e.g. "Giá trị sau thuế"), edited the same way
 * as in the tables: click the number, type, "Áp dụng". It only sets the form
 * field; the drawer's own save sends it.
 * @param {{
 *   label: string,
 *   computed: number | undefined,
 *   typed: number | undefined,
 *   onChange: (typed: number | undefined) => void,
 *   hint: string,
 *   disabledHint?: string,
 *   isDisabled?: boolean,
 * }} props
 */
export function ComputedValueCard({
  label,
  computed,
  typed,
  onChange,
  hint,
  disabledHint,
  isDisabled = false,
}) {
  const isTyped = !isDisabled && typed !== undefined;
  const value = isDisabled ? undefined : (typed ?? computed);
  const canEdit = !isDisabled && computed !== undefined;
  return (
    <MetaFormCard>
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
        <VStack gap={0}>
          <Text weight="semibold">{label}</Text>
          <Text color="secondary" size="sm">
            {isDisabled
              ? (disabledHint ?? '')
              : isTyped
                ? `Đã sửa tay · tự tính: ${formatVnd(computed)}`
                : canEdit
                  ? `${hint} — bấm vào số để sửa`
                  : hint}
          </Text>
        </VStack>
        <QuickEditValue
          label={label}
          value={value ?? 0}
          computed={computed}
          isTyped={isTyped}
          text={value === undefined ? '—' : `${formatVnd(value)} VND`}
          applyLabel="Áp dụng"
          isDisabled={!canEdit}
          isBold
          isLarge
          toneColor="var(--color-text-accent)"
          onSave={async (next) => {
            onChange(next);
            return { success: true };
          }}
        />
      </HStack>
    </MetaFormCard>
  );
}
