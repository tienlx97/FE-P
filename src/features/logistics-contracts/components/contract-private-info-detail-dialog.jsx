'use client';

import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';

import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { ContractPrivateInfoPanel } from './contract-private-info-panel.jsx';

/**
 * Standalone BOQ (private info) dialog — re-fetches the full
 * `ContractPrivateInfo` and renders the exact same `ContractPrivateInfoPanel`
 * the Contract dialog's "Liên quan" tab summary links to, so Xem/Sửa here
 * can never drift from it. Shared by `ContractPrivateInfosList` (the BOQ
 * list's own row action) and `ContractsList` ("Mở BOQ" from a contract's
 * "Liên quan" tab, tasks 3.1/3.3) — one dialog, two entrypoints, per
 * `openspec/changes/logistics-workspace-redesign/design.md` section 3.
 *
 * Guards its own close (header X, backdrop, Escape, and the footer button
 * below) on `ContractPrivateInfoPanel`'s dirty state — an in-progress edit
 * is confirmed before being discarded, the same convention `FormDialog`
 * and `ContractFormDialog` already use elsewhere in this feature.
 * @param {{ contractId: string, contractNumber: string, initialEditing?: boolean, onOpenChange: (isOpen: boolean) => void, closeLabel?: string }} props
 */
export function ContractPrivateInfoDetailDialog({
  contractId,
  contractNumber,
  initialEditing = false,
  onOpenChange,
  closeLabel = 'Đóng',
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const privateInfoQuery = useContractPrivateInfoQuery(contractId);
  const privateInfo = privateInfoQuery.data?.success
    ? privateInfoQuery.data.privateInfo
    : null;

  function requestClose() {
    if (isDirty) setConfirmingDiscard(true);
    else onOpenChange(false);
  }

  return (
    <>
      <CommonDialog
        isOpen
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        width={720}
        variant="fullscreen"
      >
        <Layout
          header={
            <DialogHeader
              title={`BOQ · ${contractNumber}`}
              onOpenChange={requestClose}
            />
          }
          content={
            <LayoutContent padding={4}>
              {privateInfo ? (
                <ContractPrivateInfoPanel
                  contractId={contractId}
                  privateInfo={privateInfo}
                  initialEditing={initialEditing}
                  onDirtyChange={setIsDirty}
                />
              ) : null}
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  width={144}
                  label={closeLabel}
                  variant="secondary"
                  onClick={requestClose}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
      <CommonDialog
        isOpen={confirmingDiscard}
        onOpenChange={(open) => {
          if (!open) setConfirmingDiscard(false);
        }}
        purpose="required"
      >
        <Layout
          header={
            <DialogHeader
              title="Bỏ thay đổi chưa lưu?"
              onOpenChange={() => setConfirmingDiscard(false)}
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
                  onClick={() => setConfirmingDiscard(false)}
                />
                <Button
                  label="Bỏ thay đổi"
                  variant="destructive"
                  onClick={() => {
                    setConfirmingDiscard(false);
                    onOpenChange(false);
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
