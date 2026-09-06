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

import { useContractForm } from '../hooks/use-contract-form.js';
import { ContractBanksFields } from './contract-banks-fields.jsx';
import { ContractGeneralFields } from './contract-general-fields.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

const styles = stylex.create({
  surface: { backgroundColor: colorVars['--color-background-surface'] },
  disabledTab: { cursor: 'not-allowed', opacity: 0.5 },
});

const TAB_LABELS = {
  info: 'Thông tin',
  paymentSchedule: 'Lịch sử thanh toán',
  shipment: 'Shipment',
  commission: 'Commission',
};

/**
 * One fullscreen workspace for creation, inspection and editing.
 * @param {{
 *   isOpen: boolean,
 *   initialMode?: 'view' | 'edit',
 *   onOpenChange: (open: boolean) => void,
 *   contract?: import('../types/index.js').Contract | null,
 *   onSuccess: (contract: import('../types/index.js').Contract) => void,
 *   activeTab: 'info' | 'paymentSchedule' | 'shipment' | 'commission',
 *   onActiveTabChange: (tab: 'info' | 'paymentSchedule' | 'shipment' | 'commission') => void,
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
  children,
}) {
  const [isEditing, setIsEditing] = useState(
    !contract || initialMode === 'edit',
  );
  const [discardAction, setDiscardAction] = useState(
    /** @type {'close' | 'cancel' | null} */ (null),
  );
  const form = useContractForm({ contract, onSuccess });
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
                    : `${isEditing ? 'Sửa hợp đồng' : 'Hợp đồng'} · ${contract.contractNumber}`
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
                    title="Lưu hợp đồng để sử dụng Lịch sử thanh toán, Shipment và Commission."
                    container="card"
                  />
                ) : null}
                {isEditing ? (
                  <form
                    id={formId}
                    onSubmit={(event) => {
                      event.currentTarget.scrollIntoView({ block: 'start' });
                      handleSubmit(event);
                    }}
                    hidden={!isEditing || activeTab !== 'info'}
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
                          <ContractGeneralFields form={form} />

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
                            />
                          </FormSection>
                        </VStack>
                      </CollapsibleGroup>
                    </VStack>
                  </form>
                ) : null}
                {!isEditing || activeTab !== 'info' ? children : null}
              </section>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="between" gap={2} wrap="wrap">
                <Text color="secondary">
                  {isEditing
                    ? isDirty
                      ? 'Có thay đổi chưa lưu'
                      : 'Nhập thông tin hợp đồng'
                    : contract?.projectName}
                </Text>
                <HStack gap={2}>
                  <Button
                    label={isEditing ? 'Hủy' : 'Đóng'}
                    variant="secondary"
                    isDisabled={isSubmitting}
                    onClick={() => requestExit(isEditing ? 'cancel' : 'close')}
                  />
                  {isEditing ? (
                    <Button
                      key="save"
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
