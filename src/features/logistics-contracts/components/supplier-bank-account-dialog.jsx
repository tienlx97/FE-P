'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import { Landmark, Save } from 'lucide-react';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { currencyOptions } from '../config/currencies.js';
import {
  useSupplierBankAccountForm,
  useVietnamBanksQuery,
} from '../hooks/use-supplier-bank-accounts.js';

/**
 * Add / edit one supplier bank account (supplier detail "Tài khoản ngân
 * hàng" tab). The bank is picked from the Vietnam bank catalog (stored by
 * short name); a name not in the catalog (an existing free-text one) stays
 * selectable. The default flag is only offered when adding — an existing
 * account becomes default through the table's star.
 * @param {{
 *   supplier: import('../types/index.js').Supplier,
 *   account: import('../types/index.js').PartyBankAccount | null,
 *   onClose: () => void,
 * }} props
 */
export function SupplierBankAccountDialog({ supplier, account, onClose }) {
  const form = useSupplierBankAccountForm({
    supplier,
    account,
    onSuccess: onClose,
  });
  const banks = useVietnamBanksQuery().data ?? [];
  const bankOptions = banks.map((bank) => ({
    value: bank.shortName,
    label: `${bank.shortName} — ${bank.name}`,
  }));
  if (
    form.values.bankName &&
    !bankOptions.some((option) => option.value === form.values.bankName)
  ) {
    bankOptions.unshift({
      value: form.values.bankName,
      label: form.values.bankName,
    });
  }
  const currencies = currencyOptions.some(
    (option) => option.value === form.values.currency,
  )
    ? currencyOptions
    : [
        { value: form.values.currency, label: form.values.currency },
        ...currencyOptions,
      ];
  const { values, setField, fieldStatuses } = form;

  return (
    <MetaFormDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      icon={Landmark}
      title={account ? 'Sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}
      width={720}
      draft={values}
      submitLabel={account ? 'Lưu thay đổi' : 'Thêm tài khoản'}
      submitIcon={Save}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <FormGrid>
          <StackItem size="fill">
            <Selector
              label="Ngân hàng"
              isRequired
              hasSearch
              hasClear
              value={values.bankName || null}
              onChange={(value) => setField('bankName', value ?? '')}
              options={bankOptions}
              status={fieldStatuses.bankName}
              width="100%"
            />
          </StackItem>
          <StackItem size="fill">
            <TextInput
              label="Số tài khoản"
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
              label="Tỉnh/TP"
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
              label="Mã SWIFT"
              value={values.swiftCode}
              onChange={(value) => setField('swiftCode', value.toUpperCase())}
              status={fieldStatuses.swiftCode}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
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
    </MetaFormDialog>
  );
}
