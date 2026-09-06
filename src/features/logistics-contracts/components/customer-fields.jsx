'use client';

import { Button } from '@astryxdesign/core/Button';
import { useCollapsible } from '@astryxdesign/core/Collapsible';
import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { FormGrid } from '@/shared/components/form-grid.jsx';

import { ExtraFieldsEditor } from './extra-fields-editor.jsx';

const styles = stylex.create({
  chevron: {
    transitionDuration: '150ms',
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-in',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
});

/**
 * Shared Customer (Party A catalog) field-set — used both by the
 * standalone Customers-page create dialog and the quick-create dialog
 * embedded in the Contract form.
 * @param {{
 *   values: import('../types/index.js').CustomerFormValues,
 *   setField: (field: keyof import('../types/index.js').CustomerFormValues, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   extraFieldRows: ReturnType<typeof import('../hooks/use-extra-field-rows.js').useExtraFieldRows>,
 *   showCompanyName?: boolean,
 *   isCollapsible?: boolean,
 *   isReadOnly?: boolean,
 * }} props
 */
export function CustomerFields({
  values,
  setField,
  fieldStatuses,
  extraFieldRows,
  showCompanyName = true,
  isCollapsible = false,
  isReadOnly = false,
}) {
  const detailsId = useId();
  const disclosure = useCollapsible({
    isCollapsible: isCollapsible ? { defaultIsOpen: false } : false,
  });
  const areDetailsShown = isReadOnly || !isCollapsible || disclosure.isOpen;

  const detailFields = (
    <VStack gap={3} hAlign="stretch" id={isCollapsible ? detailsId : undefined}>
      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Người đại diện"
            value={values.representativeName}
            onChange={(value) => setField('representativeName', value)}
            isReadOnly={isReadOnly}
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Chức vụ"
            value={values.representativeTitle}
            onChange={(value) => setField('representativeTitle', value)}
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </FormGrid>

      <TextInput
        label="Địa chỉ"
        value={values.address}
        onChange={(value) => setField('address', value)}
        isReadOnly={isReadOnly}
      />

      <ExtraFieldsEditor
        rows={extraFieldRows.rows}
        isReadOnly={isReadOnly}
        onAddRow={extraFieldRows.addRow}
        onRemoveRow={extraFieldRows.removeRow}
        onUpdateRowField={extraFieldRows.updateRowField}
      />
    </VStack>
  );

  return (
    <VStack gap={3} hAlign="stretch">
      {showCompanyName ? (
        <TextInput
          label="Tên công ty"
          value={values.companyName}
          onChange={(value) => setField('companyName', value)}
          isRequired
          status={fieldStatuses.companyName}
          statusVariant="tooltip"
          isReadOnly={isReadOnly}
        />
      ) : null}

      {isCollapsible && !isReadOnly ? (
        <Button
          label={
            disclosure.isOpen
              ? 'Ẩn bớt thông tin chi tiết'
              : 'Xem thêm thông tin chi tiết'
          }
          type="button"
          variant="ghost"
          size="sm"
          aria-controls={detailsId}
          aria-expanded={disclosure.isOpen}
          onClick={disclosure.toggle}
          endContent={
            <Icon
              icon="chevronDown"
              size="sm"
              xstyle={[styles.chevron, disclosure.isOpen && styles.chevronOpen]}
            />
          }
        />
      ) : null}

      {areDetailsShown ? detailFields : null}
    </VStack>
  );
}
