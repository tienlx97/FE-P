'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { useEditUserForm } from '../hooks/use-edit-user-form.js';
import { UserFormTabs } from './user-form-tabs.jsx';
import { UserOrgFields } from './user-org-fields.jsx';

export const EDIT_USER_DIALOG_WIDTH = 880;

/**
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   user: import('../types/index.js').UserListItem,
 *   onSuccess?: () => void,
 * }} props
 */
export function EditUserForm({ isOpen, onOpenChange, user, onSuccess }) {
  const [activeTab, setActiveTab] = useState(
    /** @type {'contact' | 'salary' | 'bank' | 'dependents' | 'permissions'} */ (
      'contact'
    ),
  );
  const {
    values,
    setField,
    fieldStatuses,
    submitError,
    submitSuccess,
    isSubmitting,
    isLoadingUser,
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
    extraPermissions,
    handleSubmit,
  } = useEditUserForm(user, { onSuccess });

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={EDIT_USER_DIALOG_WIDTH}
    >
      <form onSubmit={handleSubmit}>
        <Layout
          header={
            <DialogHeader
              title={`Cập nhật nhân viên`}
              onOpenChange={onOpenChange}
            />
          }
          content={
            <LayoutContent padding={6}>
              {/*
                The list row is a slim projection, so the form is empty until
                `GET /users/{id}` lands. Showing the blank form meanwhile would
                invite a save that erases every field the row omits — see
                `use-edit-user-form.js`.
              */}
              {isLoadingUser ? (
                <VStack gap={4} hAlign="stretch">
                  <Text color="secondary">Đang tải thông tin người dùng…</Text>
                  {[0, 1, 2, 3, 4, 5].map((row) => (
                    <Skeleton key={row} height={40} index={row} />
                  ))}
                </VStack>
              ) : (
                <VStack gap={5} hAlign="stretch">
                  {submitError ? (
                    <Banner
                      status="error"
                      title={submitError}
                      container="card"
                    />
                  ) : null}
                  {submitSuccess ? (
                    <Banner
                      status="success"
                      title={submitSuccess}
                      container="card"
                    />
                  ) : null}

                  <VStack gap={3} hAlign="stretch">
                    <VStack gap={1}>
                      <Text type="label" color="secondary">
                        Căn cước công dân
                      </Text>
                      <Text>{user.nationalId}</Text>
                    </VStack>

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
                      description="Không bắt buộc"
                      value={values.passportNumber}
                      onChange={(value) => setField('passportNumber', value)}
                      status={fieldStatuses.passportNumber}
                      statusVariant="tooltip"
                    />
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
                        /** @type {'contact' | 'salary' | 'bank' | 'dependents' | 'permissions'} */ (
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
                    permissionsFieldsProps={{
                      userId: user.id,
                      extraPermissions,
                      isLoading: isLoadingUser,
                    }}
                  />
                </VStack>
              )}
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
                  label="Lưu thay đổi"
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
