'use client';

import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';

import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { ContractPrivateInfoPanel } from './contract-private-info-panel.jsx';

/**
 * Standalone BOQ (private info) dialog — re-fetches the full
 * `ContractPrivateInfo` and renders the exact same `ContractPrivateInfoPanel`
 * the Contract dialog's "Liên quan" tab summary links to, so Xem/Sửa here
 * can never drift from it. Shared by `ContractPrivateInfosList` (the BOQ
 * list's own row action) and `ContractsList` ("Mở BOQ" from a contract's
 * "Liên quan" tab, task 3.1) — one dialog, two entrypoints, per
 * `openspec/changes/logistics-workspace-redesign/design.md` section 3.
 * @param {{ contractId: string, contractNumber: string, initialEditing?: boolean, onOpenChange: (isOpen: boolean) => void }} props
 */
export function ContractPrivateInfoDetailDialog({
  contractId,
  contractNumber,
  initialEditing = false,
  onOpenChange,
}) {
  const privateInfoQuery = useContractPrivateInfoQuery(contractId);
  const privateInfo = privateInfoQuery.data?.success
    ? privateInfoQuery.data.privateInfo
    : null;

  return (
    <CommonDialog
      isOpen
      onOpenChange={onOpenChange}
      width={720}
      variant="fullscreen"
    >
      <Layout
        header={
          <DialogHeader
            title={`BOQ · ${contractNumber}`}
            onOpenChange={() => onOpenChange(false)}
          />
        }
        content={
          <LayoutContent padding={4}>
            {privateInfo ? (
              <ContractPrivateInfoPanel
                contractId={contractId}
                privateInfo={privateInfo}
                initialEditing={initialEditing}
              />
            ) : null}
          </LayoutContent>
        }
      />
    </CommonDialog>
  );
}
