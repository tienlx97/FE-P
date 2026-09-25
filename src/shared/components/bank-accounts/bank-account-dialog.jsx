'use client';

import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Landmark, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import {
  BANK_CURRENCY_OPTIONS as currencyOptions,
  FOREIGN_BANK_FIELD_SUGGESTIONS,
} from '@/shared/config/bank-account-schema.js';
import { useBankAccountForm } from '@/shared/hooks/use-bank-account-form.js';
import { useVietnamBanksQuery } from '@/shared/hooks/use-vietnam-banks-query.js';

import { MetaFormSection } from '../custom/meta/index.js';
import { ExtraFieldsEditor } from '../extra-fields-editor.jsx';
import { FormGrid } from '../form-grid.jsx';
import { MetaFormDialog } from '../meta-form-dialog.jsx';
import { TextInput } from '../text-input.jsx';

/** @typedef {'domestic' | 'foreign'} BankKind */

/**
 * Add / edit one bank account — shared by every owner (supplier / customer /
 * seller / employee; BE-kt-xnk `unify-bank-accounts`).
 * - "Trong nước": bank from the Vietnam bank catalog (stored by short name).
 * - "Nước ngoài": free-text bank name, city / country, SWIFT/BIC.
 * - "Thông tin bổ sung": free name/value rows ("Thêm trường") for whatever
 *   else the bank needs — IBAN, routing / ABA, sort code, intermediary
 *   bank… (quick-add suggestions for a foreign bank).
 * An existing account opens as "Nước ngoài" when its bank isn't in the
 * catalog. The default flag is only offered when adding — an existing
 * account becomes default through the table's star.
 * @param {{
 *   account: import('@/shared/api/bank-accounts.js').BankAccount | null,
 *   holderDefault: string,
 *   submit: Parameters<typeof useBankAccountForm>[0]['submit'],
 *   onClose: () => void,
 * }} props
 */
export function BankAccountDialog({ account, holderDefault, submit, onClose }) {
  const form = useBankAccountForm({
    account,
    holderDefault,
    submit,
    onSuccess: onClose,
  });
  const banksQuery = useVietnamBanksQuery();
  const banks = banksQuery.data ?? [];
  const { values, setField, fieldStatuses, extraFieldRows } = form;

  const isInCatalog = banks.some((bank) => bank.shortName === values.bankName);
  // Until the user picks, follow the data: an edited account whose bank
  // isn't in the (loaded) catalog is foreign.
  const [chosenKind, setChosenKind] = useState(
    /** @type {BankKind | null} */ (null),
  );
  const kind =
    chosenKind ??
    (account && banksQuery.isSuccess && !isInCatalog ? 'foreign' : 'domestic');

  /** @param {string} next */
  function changeKind(next) {
    const nextKind = /** @type {BankKind} */ (next);
    setChosenKind(nextKind);
    // A catalog pick means nothing abroad, and vice versa.
    if (nextKind !== kind) setField('bankName', '');
  }

  const bankOptions = banks.map((bank) => ({
    value: bank.shortName,
    label: `${bank.shortName} — ${bank.name}`,
  }));
  const currencies = currencyOptions.some(
    (option) => option.value === values.currency,
  )
    ? currencyOptions
    : [{ value: values.currency, label: values.currency }, ...currencyOptions];
  const usedKeys = new Set(extraFieldRows.rows.map((row) => row.key.trim()));
  const suggestions = FOREIGN_BANK_FIELD_SUGGESTIONS.filter(
    (key) => !usedKeys.has(key),
  );

  // Portaled to <body>: the dialog often opens from inside another form
  // (contract drawer, employee dialog) and Astryx renders <dialog> in place
  // — a nested <form> in the DOM made the browser submit and reload the
  // page. React events still bubble through the portal; MetaFormDialog stops
  // its submit from reaching the outer form.
  return createPortal(
    <MetaFormDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      icon={Landmark}
      title={account ? 'Sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}
      width={760}
      draft={{ values, extraFields: extraFieldRows.rows }}
      submitLabel={account ? 'Lưu thay đổi' : 'Thêm tài khoản'}
      submitIcon={Save}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <SegmentedControl
          label="Loại ngân hàng"
          value={kind}
          onChange={changeKind}
        >
          <SegmentedControlItem value="domestic" label="Ngân hàng trong nước" />
          <SegmentedControlItem value="foreign" label="Ngân hàng nước ngoài" />
        </SegmentedControl>

        <FormGrid>
          <StackItem size="fill">
            {kind === 'domestic' ? (
              <Selector
                label="Ngân hàng"
                isRequired
                hasSearch
                hasClear
                value={isInCatalog ? values.bankName : null}
                onChange={(value) => setField('bankName', value ?? '')}
                options={bankOptions}
                status={fieldStatuses.bankName}
                width="100%"
              />
            ) : (
              <TextInput
                label="Tên ngân hàng"
                isRequired
                placeholder="Ví dụ: Deutsche Bank AG"
                value={values.bankName}
                onChange={(value) => setField('bankName', value)}
                status={fieldStatuses.bankName}
                statusVariant="tooltip"
              />
            )}
          </StackItem>
          <StackItem size="fill">
            <TextInput
              label={kind === 'foreign' ? 'Số tài khoản / IBAN' : 'Số tài khoản'}
              isRequired
              value={values.accountNumber}
              onChange={(value) => setField('accountNumber', value)}
              status={fieldStatuses.accountNumber}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
        <FormGrid>
          <StackItem size="fill">
            <TextInput
              label="Chi nhánh"
              value={values.branch}
              onChange={(value) => setField('branch', value)}
              status={fieldStatuses.branch}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="fill">
            <TextInput
              label={kind === 'foreign' ? 'Thành phố / Quốc gia' : 'Tỉnh/TP'}
              value={values.province}
              onChange={(value) => setField('province', value)}
              status={fieldStatuses.province}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
        <TextInput
          label="Chủ tài khoản"
          value={values.holder}
          onChange={(value) => setField('holder', value)}
          status={fieldStatuses.holder}
          statusVariant="tooltip"
        />
        <FormGrid>
          <StackItem size="fill">
            <Selector
              label="Loại tiền tệ"
              value={values.currency}
              onChange={(value) => setField('currency', value ?? 'VND')}
              options={currencies}
              status={fieldStatuses.currency}
              width="100%"
            />
          </StackItem>
          <StackItem size="fill">
            <TextInput
              label="Mã SWIFT / BIC"
              value={values.swiftCode}
              onChange={(value) => setField('swiftCode', value.toUpperCase())}
              status={fieldStatuses.swiftCode}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>

        <MetaFormSection
          title="Thông tin bổ sung"
          meta={
            <Text size="sm" color="secondary">
              {kind === 'foreign'
                ? 'IBAN, Routing/ABA, Sort code, ngân hàng trung gian…'
                : 'Các thông số khác của tài khoản'}
            </Text>
          }
        >
          <VStack gap={3} hAlign="stretch">
            {suggestions.length > 0 ? (
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text size="sm" color="secondary">
                  Gợi ý:
                </Text>
                {suggestions.map((key) => (
                  <Button
                    key={key}
                    label={key}
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon={Plus} size="sm" />}
                    onClick={() => form.addSuggestedField(key)}
                  />
                ))}
              </HStack>
            ) : null}
            <ExtraFieldsEditor
              rows={extraFieldRows.rows}
              onAddRow={extraFieldRows.addRow}
              onRemoveRow={extraFieldRows.removeRow}
              onUpdateRowField={extraFieldRows.updateRowField}
            />
          </VStack>
        </MetaFormSection>

        <CheckboxInput
          label="Đang hoạt động"
          value={values.isActive}
          onChange={(value) => setField('isActive', value)}
        />
        {account ? null : (
          <CheckboxInput
            label="Đặt làm tài khoản mặc định (ưu tiên 1)"
            value={values.isDefault}
            onChange={(value) => setField('isDefault', value)}
          />
        )}
      </VStack>
    </MetaFormDialog>,
    document.body,
  );
}
