'use client';

import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { FormGrid } from '@/shared/components/form-grid.jsx';

import { ExtraFieldsEditor } from './extra-fields-editor.jsx';

const TABS = [
  ['contact', 'Thông tin liên hệ'], ['payment', 'Điều khoản thanh toán'],
  ['banks', 'Tài khoản ngân hàng'], ['addresses', 'Địa chỉ khác'],
  ['notes', 'Ghi chú'], ['extra', 'Thông tin bổ sung'],
];
/** @param {string} label @param {string} field @param {any} values @param {(field: any, value: any) => void} setField @param {any} statuses @param {any} [options] */
const input = (label, field, values, setField, statuses, options = {}) => (
  <TextInput label={label} value={values[field]} onChange={(value) => setField(field, value)} status={statuses[field]} statusVariant="tooltip" {...options} />
);

/** @param {{kind: 'customer' | 'supplier', form: any, compact?: boolean}} props */
export function PartyFormFields({ kind, form, compact = false }) {
  const [activeTab, setActiveTab] = useState('contact');
  const noun = kind === 'customer' ? 'khách hàng' : 'nhà cung cấp';
  const { values, setField, fieldStatuses } = form;
  if (compact) {
    return (
      <VStack gap={3} hAlign="stretch">
        {input(`Tên ${noun}`, 'companyName', values, setField, fieldStatuses, { isRequired: true })}
        {input('Người đại diện', 'representativeName', values, setField, fieldStatuses)}
        {input('Chức vụ', 'representativeTitle', values, setField, fieldStatuses)}
        {input('Địa chỉ', 'address', values, setField, fieldStatuses)}
        <ExtraFieldsEditor rows={form.extraFieldRows.rows} onAddRow={form.extraFieldRows.addRow} onRemoveRow={form.extraFieldRows.removeRow} onUpdateRowField={form.extraFieldRows.updateRowField} />
      </VStack>
    );
  }
  return (
    <VStack gap={4} hAlign="stretch">
      <FormGrid>
        <StackItem size="fill">{input('Mã số thuế/CCCD chủ hộ', 'taxCode', values, setField, fieldStatuses)}</StackItem>
        <StackItem size="fill">{input('Mã số ĐVQHNS', 'budgetUnitCode', values, setField, fieldStatuses)}</StackItem>
        <StackItem size="fill">{input(`Mã ${noun}`, 'code', values, setField, fieldStatuses, { isRequired: true })}</StackItem>
      </FormGrid>
      <FormGrid>
        <StackItem size="fill">
          <Selector label="Loại đối tượng" value={values.isOrganization ? 'organization' : 'person'} onChange={(value) => setField('isOrganization', value !== 'person')} options={[{ value: 'organization', label: 'Tổ chức' }, { value: 'person', label: 'Cá nhân' }]} width="100%" />
        </StackItem>
        <StackItem size="fill">{input('Điện thoại', 'phone', values, setField, fieldStatuses)}</StackItem>
        <StackItem size="fill">{input('Website', 'website', values, setField, fieldStatuses)}</StackItem>
      </FormGrid>
      <FormGrid>
        <StackItem size="fill">{input(`Tên ${noun}`, 'companyName', values, setField, fieldStatuses, { isRequired: true })}</StackItem>
        <StackItem size="fill">
          <Selector label={`Nhóm ${noun}`} hasSearch hasClear value={values.groupId || null} onChange={(value) => setField('groupId', value ?? '')} options={form.lookups.groups.map((/** @type {any} */ item) => ({ value: item.id, label: item.name }))} width="100%" />
        </StackItem>
      </FormGrid>
      <TextArea label="Địa chỉ" value={values.address} onChange={(value) => setField('address', value)} />
      <CheckboxInput label="Là đối tượng nội bộ" value={values.isInternal} onChange={(value) => setField('isInternal', value)} />

      <TabList value={activeTab} onChange={setActiveTab} hasDivider role="tablist" overflow="scroll">
        {TABS.map(([value, label]) => <Tab key={value} value={value} label={label} panelId={`party-${value}`} />)}
      </TabList>

      <VStack gap={3} hAlign="stretch" id={`party-${activeTab}`} role="tabpanel">
        {activeTab === 'contact' ? (
          <>
            <FormGrid><StackItem size="fill">{input('Xưng hô', 'contactSalutation', values, setField, fieldStatuses)}</StackItem><StackItem size="fill">{input('Họ và tên', 'contactName', values, setField, fieldStatuses)}</StackItem></FormGrid>
            <FormGrid><StackItem size="fill">{input('Email', 'contactEmail', values, setField, fieldStatuses, { type: 'email' })}</StackItem><StackItem size="fill">{input('Số điện thoại', 'contactPhone', values, setField, fieldStatuses)}</StackItem></FormGrid>
            <FormGrid><StackItem size="fill">{input('Đại diện theo pháp luật', 'representativeName', values, setField, fieldStatuses)}</StackItem><StackItem size="fill">{input('Chức vụ', 'representativeTitle', values, setField, fieldStatuses)}</StackItem></FormGrid>
            <FormGrid><StackItem size="fill">{input('Người nhận hóa đơn điện tử', 'invoiceRecipientName', values, setField, fieldStatuses)}</StackItem><StackItem size="fill">{input('Số điện thoại nhận hóa đơn', 'invoiceRecipientPhone', values, setField, fieldStatuses)}</StackItem></FormGrid>
            {input('Email nhận hóa đơn (ngăn cách bằng dấu ;)', 'invoiceRecipientEmails', values, setField, fieldStatuses)}
          </>
        ) : null}
        {activeTab === 'payment' ? (
          <FormGrid>
            <StackItem size="fill"><Selector label="Điều khoản thanh toán" hasSearch hasClear value={values.paymentTermId || null} onChange={(value) => setField('paymentTermId', value ?? '')} options={form.lookups.paymentTerms.map((/** @type {any} */ item) => ({ value: item.id, label: item.name }))} width="100%" /></StackItem>
            <StackItem size="fill"><NumberInput label="Số ngày được nợ" value={values.dueDays} onChange={(value) => setField('dueDays', value)} status={fieldStatuses.dueDays} /></StackItem>
            <StackItem size="fill"><NumberInput label="Số nợ tối đa" value={values.creditLimit} onChange={(value) => setField('creditLimit', value)} status={fieldStatuses.creditLimit} /></StackItem>
            <StackItem size="fill">{input('Tài khoản công nợ phải trả/thu', 'debtAccount', values, setField, fieldStatuses)}</StackItem>
          </FormGrid>
        ) : null}
        {activeTab === 'banks' ? (
          <>
            {form.bankAccounts.map((/** @type {any} */ row) => (
              <HStack key={row.rowKey} gap={2} vAlign="end">
                <StackItem size="fill">{input('Số tài khoản', 'accountNumber', row, (field, value) => form.updateBankAccount(row.rowKey, field, value), {})}</StackItem>
                <StackItem size="fill">{input('Tên ngân hàng', 'bankName', row, (field, value) => form.updateBankAccount(row.rowKey, field, value), {})}</StackItem>
                <StackItem size="fill">{input('Chi nhánh', 'branch', row, (field, value) => form.updateBankAccount(row.rowKey, field, value), {})}</StackItem>
                <StackItem size="fill">{input('Tỉnh/TP của ngân hàng', 'province', row, (field, value) => form.updateBankAccount(row.rowKey, field, value), {})}</StackItem>
                <Button type="button" label="Xóa" variant="ghost" icon={<Icon icon={Trash2} />} onClick={() => form.removeBankAccount(row.rowKey)} />
              </HStack>
            ))}
            <HStack gap={2}><Button type="button" label="Thêm dòng" variant="secondary" size="sm" icon={<Icon icon={Plus} />} onClick={form.addBankAccount} /></HStack>
          </>
        ) : null}
        {activeTab === 'addresses' ? (
          <>
            <FormGrid><StackItem size="fill">{input('Quốc gia', 'country', values, setField, fieldStatuses)}</StackItem><StackItem size="fill">{input('Tỉnh/Thành phố', 'province', values, setField, fieldStatuses)}</StackItem></FormGrid>
            <FormGrid><StackItem size="fill">{input('Quận/Huyện', 'district', values, setField, fieldStatuses)}</StackItem><StackItem size="fill">{input('Xã/Phường', 'ward', values, setField, fieldStatuses)}</StackItem></FormGrid>
            <CheckboxInput label={`Địa chỉ giao hàng giống địa chỉ ${noun}`} value={values.deliveryAddressSameAsMain} onChange={(value) => setField('deliveryAddressSameAsMain', value)} />
            {!values.deliveryAddressSameAsMain ? form.deliveryAddresses.map((/** @type {any} */ row) => (
              <HStack key={row.rowKey} gap={2} vAlign="end"><StackItem size="fill">{input('Địa chỉ giao hàng', 'address', row, (/** @type {any} */ _, /** @type {any} */ value) => form.updateDeliveryAddress(row.rowKey, value), {})}</StackItem><Button type="button" label="Xóa" variant="ghost" icon={<Icon icon={Trash2} />} onClick={() => form.removeDeliveryAddress(row.rowKey)} /></HStack>
            )) : null}
            {!values.deliveryAddressSameAsMain ? <HStack gap={2}><Button type="button" label="Thêm dòng" variant="secondary" size="sm" icon={<Icon icon={Plus} />} onClick={form.addDeliveryAddress} /></HStack> : null}
          </>
        ) : null}
        {activeTab === 'notes' ? <TextArea label="Ghi chú" value={values.notes} onChange={(value) => setField('notes', value)} /> : null}
        {activeTab === 'extra' ? <ExtraFieldsEditor rows={form.extraFieldRows.rows} onAddRow={form.extraFieldRows.addRow} onRemoveRow={form.extraFieldRows.removeRow} onUpdateRowField={form.extraFieldRows.updateRowField} /> : null}
      </VStack>
    </VStack>
  );
}
