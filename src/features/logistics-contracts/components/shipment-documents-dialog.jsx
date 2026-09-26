'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { FileText, Save } from 'lucide-react';
import { useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  billOfLadingSteps,
  billOfLadingTypeOptions,
  EMPTY_DOCUMENTS,
} from '../config/shipment-documents.js';
import { useShipmentDocumentsMutations } from '../hooks/use-shipment-schedule-query.js';

const TWO_COLUMNS = { minWidth: 200, max: 2 };
const NO_TYPE = 'none';

/** @param {string | null} value */
const isoDate = (value) =>
  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
    value || undefined
  );

/**
 * "Cập nhật B/L": type, then draft received → issued → released (originals
 * sent / presented, or telex release; none for a sea waybill) and the
 * courier / telex reference.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   documents: import('../types/index.js').ShipmentDocuments | undefined,
 * }} props
 */
export function ShipmentDocumentsDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  documents,
}) {
  const toast = useAppToast();
  const { documents: mutation } = useShipmentDocumentsMutations(contractId, shipmentId);
  const [values, setValues] = useState(documents ?? EMPTY_DOCUMENTS);
  const [submitError, setSubmitError] = useState('');
  const steps = billOfLadingSteps(values);
  const hasRelease = steps.some((step) => step.key === 'released');

  /**
   * @template {keyof import('../types/index.js').ShipmentDocuments} K
   * @param {K} field
   * @param {import('../types/index.js').ShipmentDocuments[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if ((values.blReleaseReference ?? '').length > 100) {
      setSubmitError('Số tham chiếu tối đa 100 ký tự');
      return;
    }
    const result = await mutation.mutateAsync({
      ...values,
      // A sea waybill has nothing to release.
      blReleasedOn: hasRelease ? values.blReleasedOn : null,
      blReleaseReference: values.blReleaseReference || null,
    });
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: 'Đã cập nhật B/L.' });
    onOpenChange(false);
  }

  return (
    <MetaFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={FileText}
      title="Cập nhật B/L"
      width={600}
      draft={values}
      submitLabel="Lưu B/L"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection isBoxed isTitleUppercase={false} title="Vận đơn">
        <Selector
          label="Loại B/L"
          value={values.billOfLadingType ?? NO_TYPE}
          onChange={(value) =>
            setField(
              'billOfLadingType',
              value === NO_TYPE
                ? null
                : /** @type {import('../types/index.js').BillOfLadingType} */ (value),
            )
          }
          options={[{ value: NO_TYPE, label: 'Chưa chọn' }, ...billOfLadingTypeOptions]}
          width="100%"
        />
        <Grid columns={TWO_COLUMNS} gap={4}>
          <DateInput
            label="Nhận B/L nháp"
            value={isoDate(values.blDraftReceivedOn)}
            onChange={(value) => setField('blDraftReceivedOn', value ?? null)}
            format={formatDateInputValue}
            hasClear
            isOptional
          />
          <DateInput
            label="B/L phát hành"
            value={isoDate(values.blIssuedOn)}
            onChange={(value) => setField('blIssuedOn', value ?? null)}
            format={formatDateInputValue}
            hasClear
            isOptional
          />
          {hasRelease ? (
            <DateInput
              label={steps.at(-1)?.label ?? 'Giao chứng từ'}
              value={isoDate(values.blReleasedOn)}
              onChange={(value) => setField('blReleasedOn', value ?? null)}
              format={formatDateInputValue}
              hasClear
              isOptional
            />
          ) : null}
          {hasRelease ? (
            <TextInput
              label="Số chuyển phát / telex"
              placeholder="Ví dụ: DHL 7730012345"
              value={values.blReleaseReference ?? ''}
              onChange={(value) => setField('blReleaseReference', value)}
              isOptional
              width="100%"
            />
          ) : null}
        </Grid>
      </MetaFormSection>
    </MetaFormDialog>
  );
}
