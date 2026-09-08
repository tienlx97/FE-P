'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useContractPrivateInfoForm } from '../hooks/use-contract-private-info-form.js';
import { ContractPrivateInfoFields } from './contract-private-info-fields.jsx';

/**
 * Edit dialog for one `Contract`'s "Thông tin private" — opened from
 * `ContractExpandedDetails`'s "Thông tin private" tab (only reachable when
 * the caller has `logistics:secret`; see `contract-form-dialog.jsx`).
 * Unlike `CommissionFormDialog`, there is no separate view mode: the
 * read-only summary already lives on the tab itself
 * (`ContractPrivateInfoTab`), so this dialog only ever opens for editing.
 * `privateInfo` is passed whenever the endpoint returned one (which is
 * always, once the contract exists) so a resumed edit starts from the
 * current values instead of blank fields.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   privateInfo?: import('../types/index.js').ContractPrivateInfo | null,
 *   onSuccess?: (privateInfo: import('../types/index.js').ContractPrivateInfo) => void,
 * }} props
 */
export function ContractPrivateInfoFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  privateInfo = null,
  onSuccess,
}) {
  const toast = useAppToast();
  const form = useContractPrivateInfoForm({
    contractId,
    privateInfo,
    onSuccess: (saved) => {
      toast({ body: 'Đã cập nhật thông tin private.' });
      onOpenChange(false);
      onSuccess?.(saved);
    },
  });

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={form.title}
      submitLabel={form.submitLabel}
      width={720}
      variant="fullscreen"
      draft={{ values: form.values, extraFields: form.extraFieldRows.rows }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <ContractPrivateInfoFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        logisticsTotal={privateInfo?.logisticsTotal ?? null}
        volumeDeclaration={privateInfo?.volumeDeclaration ?? 0}
        extraFieldRows={form.extraFieldRows}
      />
    </FormDialog>
  );
}
