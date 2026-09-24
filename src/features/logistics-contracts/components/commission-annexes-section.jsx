'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus, Pencil } from 'lucide-react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForCommissionAnnexType } from '../config/commission-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionAnnexesQuery } from '../hooks/use-commission-annexes-query.js';

const styles = stylex.create({
  // Same card as the payment-history cards above it.
  row: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  tile: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    paddingInline: 'var(--spacing-1-5)',
  },
  minZero: {
    minWidth: 0,
  },
  amount: {
    flexShrink: 0,
  },
  addButton: {
    borderColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'dashed',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-accent)',
  },
});

/** @param {import('../types/index.js').CommissionAnnex} annex */
function signedAmount(annex) {
  if (annex.type === 'AmountIncrease') return annex.amount;
  if (annex.type === 'AmountDecrease') return -annex.amount;
  return 0;
}

/**
 * "Phụ lục Commission" in the Meta commission drawer (existing commissions
 * only): one card per annex — code, type, signing, signed amount — with
 * "Sửa" and a dashed "Thêm phụ lục" (`onAdd` / `onEdit` — the drawer opens
 * `CommissionAnnexFormDialog` outside its own `<form>`, since React submit
 * events bubble through portals). Annexes save on their own, independent
 * of the drawer's form, so they stay editable in view mode. The header shows
 * the value after annexes; annexes never change the commission's own
 * value (`docs/api/Commissions.md`).
 * @param {{
 *   contractId: string,
 *   commissionValue: number | undefined,
 *   currency: string,
 *   onAdd: () => void,
 *   onEdit: (annex: import('../types/index.js').CommissionAnnex) => void,
 * }} props
 */
export function CommissionAnnexesSection({
  contractId,
  commissionValue,
  currency,
  onAdd,
  onEdit,
}) {
  const annexesQuery = useCommissionAnnexesQuery(contractId);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const total =
    (commissionValue ?? 0) +
    annexes.reduce((sum, annex) => sum + signedAmount(annex), 0);

  return (
    <MetaFormSection
      isBoxed
      title="Phụ lục Commission"
      meta={
        annexes.length > 0 ? (
          <MetaPill
            label={`Sau phụ lục: ${formatMoney(total, currency)}`}
            tone="accent"
          />
        ) : undefined
      }
    >
      <VStack gap={2} hAlign="stretch">
        {annexes.length === 0 ? (
          <Text size="sm" color="secondary">
            {annexesQuery.isLoading
              ? 'Đang tải phụ lục…'
              : 'Chưa có phụ lục cho Commission này.'}
          </Text>
        ) : null}

        {annexes.map((annex) => {
          const amount = signedAmount(annex);
          return (
            <HStack
              key={annex.id}
              gap={3}
              vAlign="center"
              wrap="nowrap"
              xstyle={styles.row}
            >
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={styles.tile}
              >
                <Text as="span" size="sm" weight="bold" color="inherit">
                  PL
                </Text>
              </HStack>
              <StackItem size="fill" xstyle={styles.minZero}>
                <VStack gap={0.5} hAlign="stretch">
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text weight="bold">{annex.annexCode}</Text>
                    <MetaPill
                      label={labelForCommissionAnnexType(annex.type)}
                      tone="neutral"
                      size="sm"
                    />
                  </HStack>
                  <Text size="sm" color="secondary" maxLines={1}>
                    {[
                      `Ký ${formatDisplayDate(annex.signedDate)}`,
                      `Bên bán ${annex.sellerSigned ? 'đã ký' : 'chưa ký'}`,
                      `Bên môi giới ${annex.partySigned ? 'đã ký' : 'chưa ký'}`,
                    ].join(' · ')}
                  </Text>
                </VStack>
              </StackItem>
              {amount !== 0 ? (
                <Text
                  weight="bold"
                  color={amount > 0 ? 'accent' : 'secondary'}
                  hasTabularNumbers
                  xstyle={styles.amount}
                >
                  {amount > 0 ? '+' : '−'} {formatMoney(Math.abs(amount))}{' '}
                  {currency}
                </Text>
              ) : null}
              <IconButton
                label={`Sửa ${annex.annexCode}`}
                tooltip="Sửa phụ lục"
                icon={<Icon icon={Pencil} size="sm" />}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(annex)}
              />
            </HStack>
          );
        })}

        <Button
          label="Thêm phụ lục"
          type="button"
          variant="ghost"
          icon={<Icon icon={CirclePlus} size="sm" />}
          onClick={onAdd}
          width="100%"
          xstyle={styles.addButton}
        />
      </VStack>
    </MetaFormSection>
  );
}
