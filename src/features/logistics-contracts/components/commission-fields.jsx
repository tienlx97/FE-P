'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { overlayPaddingReset } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Pencil, Plus } from 'lucide-react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { labelForCommissionAnnexType } from '../config/commission-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionAnnexesQuery } from '../hooks/use-commission-annexes-query.js';
import { PaymentHistoryFields } from './payment-history-fields.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Signed amount label for one annex row — same sign convention as
 * `grandTotal`'s `AmountIncrease`/`AmountDecrease` math below: `InfoChange`
 * never represents a value change, so it gets no sign.
 * @param {import('../types/index.js').CommissionAnnex} annex
 * @param {string} currency
 */
function annexAmountLabel(annex, currency) {
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  if (annex.type === 'AmountDecrease') return `− ${formatted}`;
  return formatted;
}

/**
 * One boxed sub-section of the form (Đợt thanh toán / Lịch sử thanh
 * toán) — a plain, non-collapsible `Card` with its own title, so the two
 * editable tables read as distinct groups instead of running straight
 * into each other with no visual break.
 * @param {{ title: string, children: import('react').ReactNode }} props
 */
function Section({ title, children }) {
  return (
    <Card padding={4}>
      <VStack
        gap={3}
        hAlign="stretch"
        {...stylex.props(overlayPaddingReset.reset)}
      >
        <Text weight="semibold">{title}</Text>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * `Commission` field-set — single layout shared by both the Xem and Sửa
 * modes of `CommissionFormDialog`; `isReadOnly` toggles each field's
 * interactivity instead of switching to a separate read-only component.
 * `code` is user-entered, like `Contract.contractNumber` — a live
 * debounced duplicate check (`isCheckingCode`, wired through
 * `useCommissionCodeExistsQuery`) warns while typing, same UX as
 * `contractNumber`'s own field; the backend still validates uniqueness on
 * submit as the source of truth (409 surfaces via the dialog's generic
 * `submitError` banner, same as other server-side conflicts). Uses the
 * parent contract's `currency`, so there is no currency field here. "Phụ
 * lục" and "Tổng cộng" are informational and have their own actions
 * independent of this form, so they render in both modes whenever
 * `commission` exists.
 * @param {{
 *   commission?: (import('../types/index.js').Commission & {
 *     code?: string, contractNumber?: string, projectName?: string,
 *   }) | null,
 *   isReadOnly?: boolean,
 *   values: import('../types/index.js').CommissionFormValues,
 *   setField: <K extends keyof import('../types/index.js').CommissionFormValues>(field: K, value: import('../types/index.js').CommissionFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error' | 'success', message: string } | undefined>,
 *   isCheckingCode?: boolean,
 *   customers: import('../types/index.js').Customer[],
 *   currency: string,
 *   paymentTermRows: ReturnType<typeof import('../hooks/use-payment-term-rows.js').usePaymentTermRows>,
 *   paymentHistoryRows: ReturnType<typeof import('../hooks/use-payment-history-rows.js').usePaymentHistoryRows>,
 *   onAddAnnex?: () => void,
 *   onEditAnnex?: (annex: import('../types/index.js').CommissionAnnex) => void,
 *   onAddPayment?: () => void,
 * }} props
 */
export function CommissionFields({
  commission = null,
  isReadOnly = false,
  values,
  setField,
  fieldStatuses,
  isCheckingCode = false,
  customers,
  currency,
  paymentTermRows,
  paymentHistoryRows,
  onAddAnnex,
  onEditAnnex,
  onAddPayment,
}) {
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const annexesQuery = useCommissionAnnexesQuery(commission?.contractId);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];

  // "Tổng cộng" = the commission's own (live) `value` plus every annex's
  // `amount`, signed by its `type` — `AmountIncrease` adds, `AmountDecrease`
  // subtracts, `InfoChange` doesn't touch the value (matches
  // `docs/api/Commissions.md`'s note that annexes never mutate the
  // commission's own `Value`, so this total is a display-only rollup, not
  // something the backend also computes). Reading `values.value` (not the
  // stale `commission.value`) keeps the total live while editing.
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const grandTotal = (values.value ?? 0) + annexesTotal;

  return (
    <VStack gap={5} hAlign="stretch">
      <MetadataList columns={isNarrow ? 2 : 3} label={{ position: 'top' }}>
        <MetadataListItem label="Số hợp đồng">
          {orDash(commission?.contractNumber)}
        </MetadataListItem>
        <MetadataListItem label="Dự án">
          {orDash(commission?.projectName)}
        </MetadataListItem>
      </MetadataList>

      <Grid columns={isNarrow ? 1 : 2} gap={3}>
        <TextInput
          isReadOnly={isReadOnly}
          label="Mã Commission"
          value={values.code}
          onChange={(value) => setField('code', value)}
          isRequired
          isLoading={isCheckingCode}
          status={fieldStatuses.code}
          statusVariant="tooltip"
        />

        <ReadOnlyLock isActive={isReadOnly}>
          <DateInput
            format={formatDateInputValue}
            label="Ngày ký"
            value={
              /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                values.signedDate
              )
            }
            onChange={(value) => setField('signedDate', value ?? '')}
            isRequired
            status={fieldStatuses.signedDate}
            statusVariant="tooltip"
            width="100%"
          />
        </ReadOnlyLock>

        <ReadOnlyLock isActive={isReadOnly}>
          <Selector
            label="Bên nhận hoa hồng"
            hasSearch
            placeholder={isReadOnly ? '—' : 'Chọn khách hàng'}
            value={values.partyCustomerId}
            onChange={(value) => setField('partyCustomerId', value ?? '')}
            options={customers.map((customer) => ({
              value: customer.id,
              label: customer.companyName,
            }))}
            isRequired
            status={fieldStatuses.partyCustomerId}
            statusVariant="tooltip"
            width="100%"
          />
        </ReadOnlyLock>
      </Grid>

      <FormattedNumberTextInput
        label="Giá trị"
        value={values.value}
        onChange={(value) => setField('value', value)}
        units={currency || undefined}
        isRequired
        status={fieldStatuses.value}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />

      <HStack gap={4}>
        <CheckboxInput
          label="Bên bán đã ký"
          value={values.sellerSigned}
          onChange={(checked) => setField('sellerSigned', checked)}
          isReadOnly={isReadOnly}
        />
        <CheckboxInput
          label="Bên nhận hoa hồng đã ký"
          value={values.partySigned}
          onChange={(checked) => setField('partySigned', checked)}
          isReadOnly={isReadOnly}
        />
      </HStack>

      <Section title="Đợt thanh toán">
        <PaymentTermsFields
          rows={paymentTermRows.rows}
          totalPercent={paymentTermRows.totalPercent}
          status={fieldStatuses.paymentTerms}
          contractValue={values.value}
          currency={currency}
          isReadOnly={isReadOnly}
          onAddRow={paymentTermRows.addRow}
          onRemoveRow={paymentTermRows.removeRow}
          onUpdateRowField={paymentTermRows.updateRowField}
        />
      </Section>

      <Section title="Lịch sử thanh toán">
        <PaymentHistoryFields
          onQuickAdd={onAddPayment}
          rows={paymentHistoryRows.rows}
          status={fieldStatuses.paymentHistory}
          currency={currency}
          isReadOnly={isReadOnly}
          onAddRow={paymentHistoryRows.addRow}
          onRemoveRow={paymentHistoryRows.removeRow}
          onUpdateRowField={paymentHistoryRows.updateRowField}
        />
      </Section>

      {commission ? (
        <>
          <HStack hAlign="between" vAlign="center">
            <Text weight="semibold">Phụ lục</Text>
            <Button
              label="Thêm phụ lục"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Plus} />}
              onClick={onAddAnnex}
            />
          </HStack>

          {annexes.length === 0 ? (
            <Text color="secondary">Chưa có phụ lục</Text>
          ) : (
            <List hasDividers density="compact">
              {annexes.map((annex) => (
                <ListItem
                  key={annex.id}
                  label={`${annex.annexCode} · ${labelForCommissionAnnexType(annex.type)}`}
                  description={[
                    `Ký ${annex.signedDate}`,
                    `Bên bán: ${annex.sellerSigned ? 'đã ký' : 'chưa ký'}`,
                    `Bên nhận hoa hồng: ${annex.partySigned ? 'đã ký' : 'chưa ký'}`,
                  ].join(' · ')}
                  endContent={
                    <HStack gap={1} vAlign="center">
                      <Text weight="semibold">
                        {annexAmountLabel(annex, currency)}
                      </Text>
                      <IconButton
                        label={`Sửa ${annex.annexCode}`}
                        tooltip="Sửa phụ lục"
                        icon={<Icon icon={Pencil} size="sm" />}
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAnnex?.(annex)}
                      />
                    </HStack>
                  }
                />
              ))}
            </List>
          )}

          <HStack hAlign="between" vAlign="center">
            <Text weight="semibold">Tổng cộng:</Text>
            <Text weight="semibold">{formatMoney(grandTotal, currency)}</Text>
          </HStack>
        </>
      ) : null}
    </VStack>
  );
}
