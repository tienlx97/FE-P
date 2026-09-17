'use client';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';

import { useContractEditingState } from '../hooks/use-contract-editing-state.js';
import { ContractProfileFields } from './contract-profile-fields.jsx';

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
  // The native `hidden` attribute alone does NOT hide a `VStack` — its own
  // compiled `display: flex` class is author-origin CSS, which the cascade
  // always prefers over the user-agent's `[hidden] { display: none }`
  // regardless of selector specificity.
  hidden: { display: 'none' },
});

const TAB_LABELS = {
  profile: 'Hồ sơ',
  annexes: 'Phụ lục',
  payments: 'Thanh toán',
  related: 'Liên quan',
  fullView: 'Xem đầy đủ',
};

/**
 * One fullscreen workspace for creation, inspection and editing, grouped
 * into `Hồ sơ · Phụ lục · Thanh toán · Liên quan`
 * (`openspec/changes/logistics-workspace-redesign/design.md` section 3,
 * task 3.1). Xem and Sửa share the same "Hồ sơ" tab layout — only
 * `isReadOnly` differs per field (mirrors `CommissionFields`/
 * `ShipmentFormDialog`); "Phụ lục"/"Thanh toán"/"Liên quan" have no edit
 * mode of their own in this dialog — each row is edited via its own
 * `*FormDialog`, and "Liên quan" only ever shows a summary + a button that
 * opens Shipment/Commission/BOQ's own standalone dialog (never embeds
 * their editors here) — so `children` always renders regardless of
 * `isEditing`. Commission and "Thông tin private" used to drive this
 * footer directly through an imperative ref/status bridge before task
 * 3.1; that's gone now that neither is embedded, so this footer only ever
 * reflects the "Hồ sơ" form's own `isEditing`/`isDirty`.
 * @param {{
 *   isOpen: boolean,
 *   initialMode?: 'view' | 'edit',
 *   onOpenChange: (open: boolean) => void,
 *   contract?: import('../types/index.js').Contract | null,
 *   onSuccess: (contract: import('../types/index.js').Contract) => void,
 *   activeTab: 'profile' | 'annexes' | 'payments' | 'related' | 'fullView',
 *   onActiveTabChange: (tab: 'profile' | 'annexes' | 'payments' | 'related' | 'fullView') => void,
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
  const {
    form,
    formId,
    isEditing,
    setIsEditing,
    discardAction,
    setDiscardAction,
    finish,
    requestExit,
  } = useContractEditingState({
    contract,
    initialMode,
    onSuccess,
    onRequestClose: () => onOpenChange(false),
  });
  const { submitLabel, isSubmitting, handleSubmit, isDirty } = form;
  const panelId = useId();

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
                  if (contract || tab === 'profile')
                    onActiveTabChange(/** @type {typeof activeTab} */ (tab));
                }}
                role="tablist"
                hasDivider
              >
                <Tab
                  value="profile"
                  label={TAB_LABELS.profile}
                  panelId={panelId}
                />
                <Tab
                  value="annexes"
                  label={TAB_LABELS.annexes}
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                <Tab
                  value="payments"
                  label={TAB_LABELS.payments}
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                <Tab
                  value="related"
                  label={TAB_LABELS.related}
                  panelId={panelId}
                  aria-disabled={!contract}
                  xstyle={!contract && styles.disabledTab}
                />
                <Tab
                  value="fullView"
                  label={TAB_LABELS.fullView}
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
                {
                  // Both branches stay mounted (toggled with `xstyle`
                  // display:none) instead of a ternary that swaps them —
                  // `children` (`ContractExpandedDetails`) owns its own
                  // per-tab queries and would otherwise refetch/reset scroll
                  // every time the user glanced at "Hồ sơ".
                }
                <ContractProfileFields
                  form={form}
                  formId={formId}
                  isEditing={isEditing}
                  isActive={activeTab === 'profile'}
                  onSubmit={handleSubmit}
                />
                <VStack
                  gap={4}
                  hAlign="stretch"
                  xstyle={activeTab === 'profile' && styles.hidden}
                >
                  {children}
                </VStack>
              </section>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
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
                      onClick={() => onActiveTabChange('profile')}
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
                        onActiveTabChange('profile');
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
