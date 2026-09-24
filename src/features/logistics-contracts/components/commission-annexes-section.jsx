'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, CirclePlus, Pencil } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import {
  formatDateInputValue,
  formatDisplayDate,
} from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  commissionAnnexTypeOptions,
  labelForCommissionAnnexType,
} from '../config/commission-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionAnnexForm } from '../hooks/use-commission-annex-form.js';
import { useCommissionAnnexesQuery } from '../hooks/use-commission-annexes-query.js';

const THREE_COLUMNS = { minWidth: 180, max: 3 };
const TWO_COLUMNS = { minWidth: 220, max: 2 };

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
  // The open editor, outlined like an edited payment step.
  editor: {
    borderColor: 'var(--color-accent)',
  },
  tile: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    paddingInline: 'var(--spacing-1-5)',
  },
  // Same framed checkbox tile as the drawer's "Bên bán ký".
  checkTile: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-field-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minHeight: 'var(--meta-field-height)',
    paddingInline: 'var(--spacing-3)',
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
 * only): one card per annex — code, type, signing, signed amount — and the
 * value after annexes in the header (annexes never change the commission's
 * own value, `docs/api/Commissions.md`). "Thêm phụ lục" / "Sửa" open an
 * editor card in place (one at a time) that saves the annex on its own
 * (`useCommissionAnnexForm`), independent of the drawer's form — so it
 * also works in view mode.
 * @param {{
 *   contractId: string,
 *   commissionValue: number | undefined,
 *   currency: string,
 * }} props
 */
export function CommissionAnnexesSection({
  contractId,
  commissionValue,
  currency,
}) {
  // 'new', an annex id, or null when no editor is open.
  const [editing, setEditing] = useState(/** @type {string | null} */ (null));
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
        {annexes.length === 0 && editing !== 'new' ? (
          <Text size="sm" color="secondary">
            {annexesQuery.isLoading
              ? 'Đang tải phụ lục…'
              : 'Chưa có phụ lục cho Commission này.'}
          </Text>
        ) : null}

        {annexes.map((annex) =>
          editing === annex.id ? (
            <AnnexEditorCard
              key={annex.id}
              contractId={contractId}
              annex={annex}
              currency={currency}
              onDone={() => setEditing(null)}
            />
          ) : (
            <AnnexCard
              key={annex.id}
              annex={annex}
              currency={currency}
              onEdit={() => setEditing(annex.id)}
            />
          ),
        )}

        {editing === 'new' ? (
          <AnnexEditorCard
            contractId={contractId}
            currency={currency}
            onDone={() => setEditing(null)}
          />
        ) : (
          <Button
            label="Thêm phụ lục"
            type="button"
            variant="ghost"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={() => setEditing('new')}
            width="100%"
            xstyle={styles.addButton}
          />
        )}
      </VStack>
    </MetaFormSection>
  );
}

/**
 * @param {{
 *   annex: import('../types/index.js').CommissionAnnex,
 *   currency: string,
 *   onEdit: () => void,
 * }} props
 */
function AnnexCard({ annex, currency, onEdit }) {
  const amount = signedAmount(annex);
  return (
    <HStack gap={3} vAlign="center" wrap="nowrap" xstyle={styles.row}>
      <HStack as="span" hAlign="center" vAlign="center" xstyle={styles.tile}>
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
          {amount > 0 ? '+' : '−'} {formatMoney(Math.abs(amount))} {currency}
        </Text>
      ) : null}
      <IconButton
        label={`Sửa ${annex.annexCode}`}
        tooltip="Sửa phụ lục"
        icon={<Icon icon={Pencil} size="sm" />}
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
      />
    </HStack>
  );
}

/**
 * Inline create / edit card. Not a `<form>`: it sits inside the drawer's
 * form, so Enter is caught here and saves the annex instead of submitting
 * the commission.
 * @param {{
 *   contractId: string,
 *   annex?: import('../types/index.js').CommissionAnnex,
 *   currency: string,
 *   onDone: () => void,
 * }} props
 */
function AnnexEditorCard({ contractId, annex, currency, onDone }) {
  const toast = useAppToast();
  const form = useCommissionAnnexForm({
    contractId,
    annex,
    onSuccess: () => {
      toast({ body: annex ? 'Đã cập nhật phụ lục.' : 'Đã thêm phụ lục.' });
      onDone();
    },
  });
  const { values, setField } = form;
  const fieldStatuses =
    /** @type {Record<string, { type: 'error', message: string } | undefined>} */ (
      form.fieldStatuses
    );

  return (
    <VStack
      gap={3}
      hAlign="stretch"
      xstyle={[styles.row, styles.editor]}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          form.handleSubmit();
        }
      }}
    >
      <Text weight="bold">
        {annex ? `Sửa phụ lục ${annex.annexCode}` : 'Phụ lục mới'}
      </Text>

      <Grid columns={THREE_COLUMNS} gap={3}>
        <Selector
          label="Loại phụ lục"
          placeholder="Chọn loại"
          value={values.type}
          onChange={(value) =>
            setField(
              'type',
              /** @type {import('../types/index.js').CommissionAnnexType | ''} */ (
                value ?? ''
              ),
            )
          }
          options={commissionAnnexTypeOptions}
          isRequired
          status={fieldStatuses.type}
          statusVariant="tooltip"
          width="100%"
        />
        <FormattedNumberTextInput
          label="Số tiền"
          value={values.amount}
          onChange={(value) => setField('amount', value)}
          units={currency || undefined}
          isRequired
          status={fieldStatuses.amount}
          statusVariant="tooltip"
        />
        <DateInput
          label="Ngày ký"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
              values.signedDate || null
            )
          }
          onChange={(value) => setField('signedDate', value ?? '')}
          format={formatDateInputValue}
          isRequired
          status={fieldStatuses.signedDate}
          statusVariant="tooltip"
          width="100%"
        />
      </Grid>

      <Grid columns={TWO_COLUMNS} gap={3}>
        <HStack vAlign="center" xstyle={styles.checkTile}>
          <CheckboxInput
            label="Bên bán đã ký"
            value={values.sellerSigned}
            onChange={(checked) => setField('sellerSigned', checked)}
          />
        </HStack>
        <HStack vAlign="center" xstyle={styles.checkTile}>
          <CheckboxInput
            label="Bên môi giới đã ký"
            value={values.partySigned}
            onChange={(checked) => setField('partySigned', checked)}
          />
        </HStack>
      </Grid>

      {form.submitError ? (
        <Banner status="error" title={form.submitError} container="card" />
      ) : null}

      <HStack hAlign="end" gap={2} vAlign="center">
        <Button
          label="Huỷ"
          type="button"
          variant="secondary"
          isDisabled={form.isSubmitting}
          onClick={onDone}
        />
        <Button
          label={annex ? 'Lưu phụ lục' : 'Thêm phụ lục'}
          type="button"
          variant="primary"
          icon={<Icon icon={Check} size="sm" />}
          isLoading={form.isSubmitting}
          onClick={() => form.handleSubmit()}
        />
      </HStack>
    </VStack>
  );
}
