'use client';

import { VStack } from '@astryxdesign/core/VStack';
import { FolderInput } from 'lucide-react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
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
function SourceFormSession({ isOpen, onOpenChange, source }) {
  const saveMutation = useSaveSourceMutation();
  const form = useZodForm({
    initialValues: valuesOf(source),
    schema: sourceSchema,
    submit: (values) => saveMutation.mutateAsync({ values, id: source?.id }),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={FolderInput}
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
      <MetaFormSection isBoxed title="Thông tin nguồn" isTitleUppercase={false}>
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
      </MetaFormSection>
    </FormDialog>
  );
}

/** @param {Parameters<typeof SourceFormSession>[0]} props */
export function SourceFormDialog(props) {
  return props.isOpen ? (
    <SourceFormSession key={props.source?.id ?? 'new'} {...props} />
  ) : null;
}
