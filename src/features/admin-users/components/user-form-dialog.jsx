'use client';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';

import { useCreateUserFormV2 } from '../hooks/use-create-user-form-v2.js';
import { useEditUserFormV2 } from '../hooks/use-edit-user-form-v2.js';
import { BankAccountsFields } from './bank-accounts-fields.jsx';
import { CreateUserPermissionsFields } from './create-user-permissions-fields.jsx';
import { UserEmployeeFields } from './user-employee-fields.jsx';
import { UserIdentityFields } from './user-identity-fields.jsx';
import { UserOrgFields } from './user-org-fields.jsx';
import { UserPermissionsFields } from './user-permissions-fields.jsx';
import { UserSessionFields } from './user-session-fields.jsx';

/**
 * The v2 create/edit dialog. Replaces v1's tab strip with a stack of cards:
 * one always-open card with the fields needed to identify the person, then
 * one collapsed card per topic. Both modes render exactly this — everything
 * that differs between creating and editing is resolved by the hook into the
 * `controller` contract (`types/index.js`, `UserFormV2Controller`), so there
 * is a single layout to maintain rather than two that drift apart.
 *
 * Sections are `type="multiple"`; work starts open and validation reveals all: an accordion that closes
 * the previous section would hide fields the Admin already filled in, and a
 * validation error on a closed section still has to be reachable.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   controller: import('../types/index.js').UserFormV2Controller,
 * }} props
 */
function UserFormDialogShell({ isOpen, onOpenChange, controller }) {
  const {
    mode,
    title,
    submitLabel,
    isLoadingUser,
    values,
    setField,
    fieldStatuses,
    password,
    editableNationalId,
    readOnlyEmployeeCode,
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
    permissionsFieldsProps,
    createPermissionsFieldsProps,
    concurrentSessionsProps,
    handleSubmit,
  } = controller;

  const [expandedSections, setExpandedSections] = useState(['work']);
  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="fullscreen"
      title={title}
      submitLabel={submitLabel}
      isReady={!isLoadingUser}
      draft={{ values, banks: bankAccountRows }}
      isSubmitting={isSubmitting}
      submitError={controller.loadError || submitError}
      fieldStatuses={fieldStatuses}
      successMessage={submitSuccess}
      onSubmit={handleSubmit}
      onValidation={() =>
        setExpandedSections([
          'work',
          'bank',
          'employee',
          'permissions',
          'sessions',
        ])
      }
    >
      {isLoadingUser ? (
        <VStack gap={3} hAlign="stretch">
          {controller.loadError ? (
            <Button
              label="Thử tải lại"
              variant="secondary"
              onClick={controller.retryLoad}
            />
          ) : (
            <>
              <Text color="secondary">Đang tải thông tin người dùng…</Text>
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} height={40} index={row} />
              ))}
            </>
          )}
        </VStack>
      ) : (
        <>
          <Card>
            <VStack gap={3} hAlign="stretch">
              <Text type="large" weight="semibold">
                {mode === 'edit'
                  ? 'Thông tin người dùng'
                  : 'Thông tin khởi tạo'}
              </Text>
              <UserIdentityFields
                values={values}
                setField={setField}
                fieldStatuses={fieldStatuses}
                password={password}
              />
            </VStack>
          </Card>

          <CollapsibleGroup
            type="multiple"
            value={expandedSections}
            onChange={(value) =>
              setExpandedSections(Array.isArray(value) ? value : [value])
            }
          >
            <VStack gap={3} hAlign="stretch">
              <FormSection value="work" title="Thông tin công việc">
                <UserOrgFields
                  values={values}
                  setField={setField}
                  fieldStatuses={fieldStatuses}
                  companies={companies}
                  branches={branches}
                  departments={departments}
                  positions={positions}
                />
              </FormSection>

              <FormSection value="bank" title="Thông tin ngân hàng">
                <BankAccountsFields
                  rows={bankAccountRows}
                  vietnamBanks={vietnamBanks}
                  onAddRow={addBankAccountRow}
                  onRemoveRow={removeBankAccountRow}
                  onClearRows={clearBankAccountRows}
                  onUpdateRowField={updateBankAccountRowField}
                  onSetPrimaryRow={setPrimaryBankAccountRow}
                />
              </FormSection>

              <FormSection value="employee" title="Thông tin nhân viên">
                <UserEmployeeFields
                  values={values}
                  setField={setField}
                  fieldStatuses={fieldStatuses}
                  editableNationalId={editableNationalId}
                  readOnlyEmployeeCode={readOnlyEmployeeCode}
                  oldProvinces={oldProvinces}
                  oldDistricts={oldDistricts}
                  oldWards={oldWards}
                  newProvinces={newProvinces}
                  newWards={newWards}
                />
              </FormSection>

              {/* Create mode leaves this null — granting a permission
                          to an account that doesn't exist yet is meaningless. */}
              {permissionsFieldsProps ? (
                <FormSection value="permissions" title="Phân quyền">
                  <UserPermissionsFields {...permissionsFieldsProps} />
                </FormSection>
              ) : null}

              {createPermissionsFieldsProps ? (
                <FormSection value="permissions" title="Phân quyền">
                  <CreateUserPermissionsFields
                    {...createPermissionsFieldsProps}
                  />
                </FormSection>
              ) : null}

              {concurrentSessionsProps ? (
                <FormSection value="sessions" title="Phiên đăng nhập">
                  <UserSessionFields {...concurrentSessionsProps} />
                </FormSection>
              ) : null}
            </VStack>
          </CollapsibleGroup>
        </>
      )}
    </FormDialog>
  );
}

/**
 * Mode wrappers exist only because hooks can't be called conditionally: each
 * one calls its own hook and hands the same contract to the same shell.
 * @param {{ isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSuccess?: () => void }} props
 */
function CreateUserFormDialog({ isOpen, onOpenChange, onSuccess }) {
  const controller = useCreateUserFormV2({ onSuccess });

  return (
    <UserFormDialogShell
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      controller={controller}
    />
  );
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   user: import('../types/index.js').UserListItem,
 *   onSuccess?: () => void,
 * }} props
 */
function EditUserFormDialog({ isOpen, onOpenChange, user, onSuccess }) {
  const controller = useEditUserFormV2(user, { onSuccess });

  return (
    <UserFormDialogShell
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      controller={controller}
    />
  );
}

/**
 * v2 of `CreateUserForm`/`EditUserForm`, now a single dialog. `mode="edit"`
 * requires `user`; the create flow has no record to edit yet.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onSuccess?: () => void,
 * } & (
 *   { mode: 'create', user?: undefined } |
 *   { mode: 'edit', user: import('../types/index.js').UserListItem }
 * )} props
 */
export function UserFormDialog({
  mode,
  user,
  isOpen,
  onOpenChange,
  onSuccess,
}) {
  if (!isOpen) return null;
  if (mode === 'edit') {
    return (
      <EditUserFormDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        user={user}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <CreateUserFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}
