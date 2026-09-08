'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { IconShuffle } from '@/shared/components/icon/icon-shuffle.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { generateRandomPassword } from '../config/generate-password.js';
import { useCreateUserForm } from '../hooks/use-create-user-form.js';
import { UserFormTabs } from './user-form-tabs.jsx';
import { UserOrgFields } from './user-org-fields.jsx';

export const CREATE_USER_DIALOG_WIDTH = 880;

/** @param {{ isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSuccess?: () => void }} props */
export function CreateUserForm({ isOpen, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState(
    /** @type {'contact' | 'salary' | 'bank' | 'dependents'} */ ('contact'),
  );
  const {
    values,
    setField,
    fieldStatuses,
    submitError,
    submitSuccess,
    isSubmitting,
    companies,
    branches,
    departments,
    positions,
    vietnamBanks,
    oldProvinces,
    oldDistricts,
    oldWards,
    newProvinces,
    newWards,
    bankAccountRows,
    addBankAccountRow,
    removeBankAccountRow,
    clearBankAccountRows,
    updateBankAccountRowField,
    setPrimaryBankAccountRow,
    handleSubmit,
  } = useCreateUserForm({ onSuccess });

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={CREATE_USER_DIALOG_WIDTH}
    >
      <form onSubmit={handleSubmit}>
        <Layout
          header={
            <DialogHeader title="TẠO NGƯỜI DÙNG" onOpenChange={onOpenChange} />
          }
          content={
            <LayoutContent padding={6}>
              <VStack gap={5} hAlign="stretch">
                {submitError ? (
                  <Banner status="error" title={submitError} container="card" />
                ) : null}
                {submitSuccess ? (
                  <Banner
                    status="success"
                    title={submitSuccess}
                    container="card"
                  />
                ) : null}

                <VStack gap={3} hAlign="stretch">
                  <TextInput
                    label="Căn cước công dân"
                    value={values.nationalId}
                    onChange={(value) => setField('nationalId', value)}
                    placeholder="Nhập số CCCD (12 số)"
                    isRequired
                    status={fieldStatuses.nationalId}
                    statusVariant="tooltip"
                  />

                  <HStack gap={3}>
                    <StackItem size="fill">
                      <TextInput
                        label="Họ"
                        value={values.lastName}
                        onChange={(value) => setField('lastName', value)}
                        isRequired
                        status={fieldStatuses.lastName}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                    <StackItem size="fill">
                      <TextInput
                        label="Tên"
                        value={values.firstName}
                        onChange={(value) => setField('firstName', value)}
                        isRequired
                        status={fieldStatuses.firstName}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                  </HStack>

                  <HStack gap={3}>
                    <StackItem size="fill">
                      <NumberInput
                        label="Năm sinh"
                        value={values.yearOfBirth}
                        onChange={(value) => setField('yearOfBirth', value)}
                        min={1900}
                        isIntegerOnly
                        isRequired
                        status={fieldStatuses.yearOfBirth}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                    <StackItem size="fill">
                      <RadioList
                        label="Giới tính"
                        orientation="horizontal"
                        value={values.gender}
                        onChange={(value) => setField('gender', value)}
                        status={fieldStatuses.gender}
                        size="sm"
                      >
                        <RadioListItem label="Nam" value="Male" />
                        <RadioListItem label="Nữ" value="Female" />
                        <RadioListItem label="Khác" value="Other" />
                      </RadioList>
                    </StackItem>
                  </HStack>

                  <HStack gap={3}>
                    <StackItem size="fill">
                      <DateInput
                        label="Ngày cấp CCCD"
                        value={
                          /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                            values.nationalIdIssueDate || undefined
                          )
                        }
                        onChange={(value) =>
                          setField('nationalIdIssueDate', value ?? '')
                        }
                        format={formatDateInputValue}
                        isRequired
                        status={fieldStatuses.nationalIdIssueDate}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                    <StackItem size="fill">
                      <TextInput
                        label="Nơi cấp CCCD"
                        value={values.nationalIdIssuePlace}
                        onChange={(value) =>
                          setField('nationalIdIssuePlace', value)
                        }
                        isRequired
                        status={fieldStatuses.nationalIdIssuePlace}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                  </HStack>

                  <TextInput
                    label="Số hộ chiếu"
                    value={values.passportNumber}
                    onChange={(value) => setField('passportNumber', value)}
                    status={fieldStatuses.passportNumber}
                    statusVariant="tooltip"
                  />

                  <HStack gap={2}>
                    <StackItem size="fill">
                      <TextInput
                        label="Mật khẩu tạm"
                        value={values.password}
                        onChange={(value) => setField('password', value)}
                        type="text"
                        placeholder="Tối thiểu 8 ký tự, có hoa/thường/số/ký tự đặc biệt"
                        isRequired
                        status={fieldStatuses.password}
                        statusVariant="tooltip"
                      />
                    </StackItem>
                    <StackItem crossAlignSelf="end">
                      <IconButton
                        label="Tạo mật khẩu ngẫu nhiên"
                        tooltip="Ngẫu nhiên"
                        icon={<Icon icon={IconShuffle} size="sm" />}
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setField('password', generateRandomPassword())
                        }
                      />
                    </StackItem>
                  </HStack>
                </VStack>

                <Divider />

                <UserOrgFields
                  values={values}
                  setField={setField}
                  fieldStatuses={fieldStatuses}
                  companies={companies}
                  branches={branches}
                  departments={departments}
                  positions={positions}
                />

                <Divider />

                <UserFormTabs
                  activeTab={activeTab}
                  onActiveTabChange={(tab) =>
                    setActiveTab(
                      /** @type {'contact' | 'salary' | 'bank' | 'dependents'} */ (
                        tab
                      ),
                    )
                  }
                  contactFieldsProps={{
                    values,
                    setField,
                    fieldStatuses,
                    oldProvinces,
                    oldDistricts,
                    oldWards,
                    newProvinces,
                    newWards,
                  }}
                  bankAccountsFieldsProps={{
                    rows: bankAccountRows,
                    vietnamBanks,
                    onAddRow: addBankAccountRow,
                    onRemoveRow: removeBankAccountRow,
                    onClearRows: clearBankAccountRows,
                    onUpdateRowField: updateBankAccountRowField,
                    onSetPrimaryRow: setPrimaryBankAccountRow,
                  }}
                />
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Hủy"
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                />
                <Button
                  label="Tạo người dùng"
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
