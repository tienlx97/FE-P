'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import { useContractForm } from '../hooks/use-contract-form.js';
import { ContractBanksFields } from './contract-banks-fields.jsx';
import { ContractGeneralFields } from './contract-general-fields.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

const styles = stylex.create({
  hint: {
    flex: '1',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  surface: { backgroundColor: colorVars['--color-background-surface'] },
  disabledTab: { cursor: 'not-allowed', opacity: 0.5 },
});

const TAB_LABELS = {
  info: 'Thông tin',
  paymentSchedule: 'Lịch sử thanh toán',
  shipment: 'Shipment',
  commission: 'Commission',
  privateInfo: 'Thông tin private',
};

// Deliberately NOT role/department-derived — gates the tab the same way
// the backend gates the endpoint (see
// `openspec/changes/add-contract-private-info/`, BE-kt-xnk).
const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

/**
 * One fullscreen workspace for creation, inspection and editing. Xem and
 * Sửa share the same "Thông tin" tab layout — only `isReadOnly` differs per
 * field (mirrors `CommissionFormDialog`/`ShipmentFormDialog`); Lịch sử
 * thanh toán/Shipment/Commission have no edit mode of their own in this
 * dialog — each is edited via its own `*FormDialog` — so they always
 * render `children` regardless of `isEditing`. "Thông tin private" only
 * renders at all for a caller with `logistics:secret` (unlike every other
 * tab, not role/department-derived — see
 * `openspec/changes/add-contract-private-info/`, BE-kt-xnk); unlike those
 * three, its own edit mode *is* driven by this dialog's footer —
 * `privateInfoEditController` bridges to `ContractPrivateInfoPanel`'s
 * imperative ref/status (see that component's doc comment for why: it
 * has no separate `*FormDialog`, and a second tab-local edit button next
 * to "Sửa hợp đồng" was redundant).
 * @param {{
 *   isOpen: boolean,
 *   initialMode?: 'view' | 'edit',
 *   onOpenChange: (open: boolean) => void,
 *   contract?: import('../types/index.js').Contract | null,
 *   onSuccess: (contract: import('../types/index.js').Contract) => void,
 *   activeTab: 'info' | 'paymentSchedule' | 'shipment' | 'commission' | 'privateInfo',
 *   onActiveTabChange: (tab: 'info' | 'paymentSchedule' | 'shipment' | 'commission' | 'privateInfo') => void,
 *   onAddAnnex?: () => void,
 *   onEditAnnex?: (annex: import('../types/index.js').ContractAnnex) => void,
 *   privateInfoEditController?: {
 *     status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string } | null,
 *     startEditing: () => void,
 *     cancelEditing: () => void,
 *     submit: () => void,
 *   } | null,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function ContractFormDialog({
  isOpen,
  initialMode = 'view',
  onOpenChange,
  contract = null,
  onSuccess,
  activeTab,
  onActiveTabChange,
  onAddAnnex,
  onEditAnnex,
  privateInfoEditController = null,
  children,
}) {
  const [isEditing, setIsEditing] = useState(
    !contract || initialMode === 'edit',
  );
  const [discardAction, setDiscardAction] = useState(
    /** @type {'close' | 'cancel' | null} */ (null),
  );
  const toast = useAppToast();
  const form = useContractForm({
    contract,
    onSuccess: (saved) => {
      toast({ body: contract ? 'Đã cập nhật hợp đồng.' : 'Đã tạo hợp đồng.' });
      onSuccess(saved);
    },
  });
  const {
    submitLabel,
    values,
    setBankIds,
    fieldStatuses,
    banks,
    paymentTermRows,
    submitError,
    isSubmitting,
    handleSubmit,
    isDirty,
  } = form;
  const formId = useId();
  const panelId = useId();
  const hasLogisticsSecret = useSessionPermissions().includes(
    LOGISTICS_SECRET_PERMISSION,
  );
  const isPrivateInfoTab =
    activeTab === 'privateInfo' && privateInfoEditController != null;
  const privateInfoStatus = privateInfoEditController?.status ?? null;
  const privateInfoIsEditing = privateInfoStatus?.isEditing ?? false;

  /** @param {'close' | 'cancel'} action */
  function finish(action) {
    if (action === 'close' || !contract) onOpenChange(false);
    else onSuccess(contract);
  }

  /** @param {'close' | 'cancel'} action */
  function requestExit(action) {
    if (isSubmitting) return;
    if (isEditing && isDirty) setDiscardAction(action);
    else finish(action);
  }

  return (
    <>
      <CommonDialog
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) requestExit('close');
        }}
        variant="fullscreen"
        xstyle={styles.surface}
      >
        <Layout
          header={
            <VStack gap={2} hAlign="stretch">
              <DialogHeader
                title={
                  !contract
                    ? 'Tạo hợp đồng'
                    : `Hợp đồng · ${contract.contractNumber}`
                }
                onOpenChange={() => requestExit('close')}
              />
              <TabList
                value={activeTab}
                onChange={(tab) => {
                  if (contract || tab === 'info')
                    onActiveTabChange(/** @type {typeof activeTab} */ (tab));
                }}
                role="tablist"
                hasDivider
              >
                <Tab value="info" label="Thông tin" panelId={panelId} />
                <Tab
                  value="paymentSchedule"
                  label="Lịch sử thanh toán"
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                <Tab
                  value="shipment"
                  label="Shipment"
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                <Tab
                  value="commission"
                  label="Commission"
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                {hasLogisticsSecret ? (
                  <Tab
                    value="privateInfo"
                    label="Thông tin private"
                    panelId={panelId}
                    aria-disabled={!contract}
                    xstyle={!contract && styles.disabledTab}
                  />
                ) : null}
              </TabList>
            </VStack>
          }
          content={
            <LayoutContent padding={4}>
              <section
                id={panelId}
                role="tabpanel"
                aria-label={TAB_LABELS[activeTab]}
                tabIndex={0}
              >
                {!contract ? (
                  <Banner
                    status="info"
                    title="Lịch sử thanh toán, Shipment, Commission và Thông tin private được quản lý sau khi lưu hợp đồng."
                    container="card"
                  />
                ) : null}
                {activeTab === 'info' ? (
                  <form
                    id={formId}
                    onSubmit={(event) => {
                      if (!isEditing) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                      }
                      event.currentTarget.scrollIntoView({ block: 'start' });
                      handleSubmit(event);
                    }}
                  >
                    <VStack gap={4} hAlign="stretch">
                      {submitError ? (
                        <Banner
                          status="error"
                          title={submitError}
                          container="card"
                        />
                      ) : null}
                      <CollapsibleGroup
                        type="multiple"
                        defaultValue={['general', 'paymentTerms', 'banks']}
                      >
                        <VStack gap={3} hAlign="stretch">
                          <ContractGeneralFields
                            form={form}
                            contract={contract}
                            isReadOnly={!isEditing}
                            onAddAnnex={onAddAnnex}
                            onEditAnnex={onEditAnnex}
                          />

                          <FormSection
                            value="paymentTerms"
                            title="Đợt thanh toán"
                            isDisabled
                          >
                            <PaymentTermsFields
                              rows={paymentTermRows.rows}
                              totalPercent={paymentTermRows.totalPercent}
                              status={fieldStatuses.paymentTerms}
                              contractValue={values.contractValue}
                              currency={values.currency}
                              isReadOnly={!isEditing}
                              onAddRow={paymentTermRows.addRow}
                              onRemoveRow={paymentTermRows.removeRow}
                              onUpdateRowField={paymentTermRows.updateRowField}
                            />
                          </FormSection>

                          <FormSection
                            value="banks"
                            title="Ngân hàng thụ hưởng"
                            isDisabled
                          >
                            <ContractBanksFields
                              banks={banks}
                              selectedBankIds={values.bankIds}
                              onChange={setBankIds}
                              status={fieldStatuses.bankIds}
                              isReadOnly={!isEditing}
                            />
                          </FormSection>
                        </VStack>
                      </CollapsibleGroup>
                    </VStack>
                  </form>
                ) : (
                  children
                )}
              </section>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              {isPrivateInfoTab ? (
                <HStack hAlign="between" gap={2}>
                  <Text color="secondary" xstyle={styles.hint}>
                    {privateInfoIsEditing
                      ? 'Có thay đổi Thông tin private chưa lưu'
                      : 'Thông tin private'}
                  </Text>
                  <HStack gap={2}>
                    <Button
                      width={80}
                      label={privateInfoIsEditing ? 'Hủy' : 'Đóng'}
                      variant="secondary"
                      isDisabled={privateInfoStatus?.isSubmitting}
                      onClick={() =>
                        privateInfoIsEditing
                          ? privateInfoEditController.cancelEditing()
                          : requestExit('close')
                      }
                    />
                    <Button
                      key="private-info-action"
                      width={200}
                      type="button"
                      label={privateInfoStatus?.submitLabel ?? 'Sửa Thông tin private'}
                      variant="primary"
                      isLoading={privateInfoStatus?.isSubmitting}
                      onClick={() =>
                        privateInfoIsEditing
                          ? privateInfoEditController.submit()
                          : privateInfoEditController.startEditing()
                      }
                    />
                  </HStack>
                </HStack>
              ) : (
                <HStack hAlign="between" gap={2}>
                  <Text color="secondary" xstyle={styles.hint}>
                    {isEditing
                      ? isDirty
                        ? 'Có thay đổi chưa lưu'
                        : 'Nhập thông tin hợp đồng'
                      : contract?.projectName}
                  </Text>
                  <HStack gap={2}>
                    <Button
                      width={80}
                      label={isEditing ? 'Hủy' : 'Đóng'}
                      variant="secondary"
                      isDisabled={isSubmitting}
                      onClick={() => requestExit(isEditing ? 'cancel' : 'close')}
                    />
                    {isEditing ? (
                      <Button
                        key="save"
                        width={144}
                        label={submitLabel}
                        type="submit"
                        form={formId}
                        variant="primary"
                        isLoading={isSubmitting}
                        onClick={() => onActiveTabChange('info')}
                      />
                    ) : (
                      <Button
                        key="edit"
                        width={144}
                        type="button"
                        label="Sửa hợp đồng"
                        variant="primary"
                        onClick={(event) => {
                          event.preventDefault();
                          onActiveTabChange('info');
                          setIsEditing(true);
                        }}
                      />
                    )}
                  </HStack>
                </HStack>
              )}
            </LayoutFooter>
          }
        />
      </CommonDialog>
      <CommonDialog
        isOpen={discardAction !== null}
        onOpenChange={(open) => {
          if (!open) setDiscardAction(null);
        }}
        purpose="required"
      >
        <Layout
          header={
            <DialogHeader
              title="Bỏ thay đổi chưa lưu?"
              onOpenChange={() => setDiscardAction(null)}
            />
          }
          content={
            <LayoutContent padding={4}>
              <Text>Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu.</Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Tiếp tục nhập"
                  variant="primary"
                  onClick={() => setDiscardAction(null)}
                />
                <Button
                  label="Bỏ thay đổi"
                  variant="destructive"
                  onClick={() => {
                    if (discardAction) finish(discardAction);
                    setDiscardAction(null);
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </>
  );
}
