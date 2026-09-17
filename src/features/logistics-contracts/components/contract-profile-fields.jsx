'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { VStack } from '@astryxdesign/core/VStack';

import { FormSection } from '@/shared/components/form-section.jsx';

import { ContractBanksFields } from './contract-banks-fields.jsx';
import { ContractGeneralFields } from './contract-general-fields.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

/**
 * The "Hồ sơ" tab body — general fields + payment-term rows + bank
 * selection — shared by `ContractFormDialog` and `ContractDetailWorkspace`
 * (`/logistics/contract/[id]`) so both render the exact same form instead
 * of drifting. `isActive` toggles `hidden` rather than unmounting, matching
 * every other multi-tab surface in this feature (preserves scroll/draft
 * state while another tab is showing).
 * @param {{
 *   form: ReturnType<typeof import('../hooks/use-contract-editing-state.js').useContractEditingState>['form'],
 *   formId: string,
 *   isEditing: boolean,
 *   isActive: boolean,
 *   onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => void,
 * }} props
 */
export function ContractProfileFields({
  form,
  formId,
  isEditing,
  isActive,
  onSubmit,
}) {
  const {
    values,
    setBankIds,
    fieldStatuses,
    banks,
    paymentTermRows,
    submitError,
  } = form;

  return (
    <form
      id={formId}
      hidden={!isActive}
      onSubmit={(event) => {
        if (!isEditing) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.currentTarget.scrollIntoView({ block: 'start' });
        onSubmit(event);
      }}
    >
      <VStack gap={4} hAlign="stretch">
        {submitError ? (
          <Banner status="error" title={submitError} container="card" />
        ) : null}
        <CollapsibleGroup
          type="multiple"
          defaultValue={['general', 'paymentTerms', 'banks']}
        >
          <VStack gap={3} hAlign="stretch">
            <ContractGeneralFields form={form} isReadOnly={!isEditing} />

            <FormSection value="paymentTerms" title="Đợt thanh toán" isDisabled>
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

            <FormSection value="banks" title="Ngân hàng thụ hưởng" isDisabled>
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
  );
}
