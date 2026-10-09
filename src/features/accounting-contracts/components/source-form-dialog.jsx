'use client';

import { VStack } from '@astryxdesign/core/VStack';
import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { sourceSchema } from '../config/catalog-schemas.js';
import { useSaveSourceMutation } from '../hooks/use-catalogs.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/** @param {import('../types/index.js').AccountingSource | null} source */
function valuesOf(source) {
  return { name: source?.name ?? '', note: source?.note ?? '' };
}

/**
 * Create (no `source`) or edit a "Nguồn".
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   source: import('../types/index.js').AccountingSource | null,
 * }} props
 */
export function SourceFormDialog({ isOpen, onOpenChange, source }) {
  const saveMutation = useSaveSourceMutation();
  const form = useZodForm({
    initialValues: valuesOf(source),
    schema: sourceSchema,
    submit: (values) => saveMutation.mutateAsync({ values, id: source?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { reset } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(source));
    // Reload the values each time the dialog opens on a (possibly other) source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source]);

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={source ? 'Sửa nguồn' : 'Thêm nguồn'}
      submitLabel={source ? 'Lưu' : 'Thêm'}
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={3} hAlign="stretch">
        <TextInput
          label="Tên nguồn"
          value={form.values.name}
          onChange={(value) => form.setField('name', value)}
          isRequired
          status={form.fieldStatuses.name}
          statusVariant="tooltip"
        />
        <TextArea
          label="Ghi chú"
          value={form.values.note}
          onChange={(value) => form.setField('note', value)}
          isOptional
          maxLength={1000}
          status={form.fieldStatuses.note}
          statusVariant="tooltip"
        />
      </VStack>
    </FormDialog>
  );
}
