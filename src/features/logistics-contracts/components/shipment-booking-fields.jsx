'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** @param {{
 * values: import('../types/index.js').ShipmentFormValues,
 * setField: <K extends keyof import('../types/index.js').ShipmentFormValues>(field: K, value: import('../types/index.js').ShipmentFormValues[K]) => void,
 * fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * customers: import('../types/index.js').Customer[],
 * isReadOnly?: boolean,
 * }} props */
export function ShipmentBookingFields({
  values,
  setField,
  fieldStatuses,
  customers,
  isReadOnly = false,
}) {
  const supplierName =
    customers.find((customer) => customer.id === values.supplierCustomerId)
      ?.companyName ?? '—';

  return (
    <FormSection value="book" title="Thông tin Book">
      {isReadOnly ? (
        <MetadataList columns={1} label={{ position: 'top' }}>
          <MetadataListItem label="Forwarder">{supplierName}</MetadataListItem>
        </MetadataList>
      ) : (
        <Selector
          label="Forwarder"
          hasSearch
          placeholder="Chọn forwarder"
          value={values.supplierCustomerId}
          onChange={(value) => setField('supplierCustomerId', value ?? '')}
          options={customers.map((customer) => ({
            value: customer.id,
            label: customer.companyName,
          }))}
          isRequired
          status={fieldStatuses.supplierCustomerId}
          statusVariant="tooltip"
          width="100%"
        />
      )}

      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Số booking"
            value={values.bookingNumber}
            onChange={(value) => setField('bookingNumber', value)}
            isRequired
            status={fieldStatuses.bookingNumber}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Số B/L"
            value={values.billOfLadingNumber}
            onChange={(value) => setField('billOfLadingNumber', value)}
            isOptional
            status={fieldStatuses.billOfLadingNumber}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </FormGrid>

      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Line tàu"
            placeholder="Ví dụ: KMTC, SITC"
            value={values.shippingLine}
            onChange={(value) => setField('shippingLine', value)}
            isOptional
            status={fieldStatuses.shippingLine}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Tên tàu"
            placeholder="Ví dụ: KMTC JAKARTA // 2604S"
            value={values.vesselName}
            onChange={(value) => setField('vesselName', value)}
            isOptional
            status={fieldStatuses.vesselName}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </FormGrid>

      {isReadOnly ? (
        <MetadataList columns={2} label={{ position: 'top' }}>
          <MetadataListItem label="ETD">{orDash(values.etd)}</MetadataListItem>
          <MetadataListItem label="ETA">{orDash(values.eta)}</MetadataListItem>
        </MetadataList>
      ) : (
        <FormGrid>
          <StackItem size="fill">
            <DateInput
              label="ETD"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.etd || null
                )
              }
              onChange={(value) => setField('etd', value ?? '')}
              format="system_date"
              isOptional
              status={fieldStatuses.etd}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="fill">
            <DateInput
              label="ETA"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.eta || null
                )
              }
              onChange={(value) => setField('eta', value ?? '')}
              format="system_date"
              isOptional
              status={fieldStatuses.eta}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
      )}

      <FormGrid>
        <StackItem size="fill">
          <TextInput
            label="Cảng/nơi xếp hàng"
            value={values.placeOfLoading}
            onChange={(value) => setField('placeOfLoading', value)}
            isOptional
            status={fieldStatuses.placeOfLoading}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Cảng/nơi đến"
            value={values.placeOfDischarge}
            onChange={(value) => setField('placeOfDischarge', value)}
            isOptional
            status={fieldStatuses.placeOfDischarge}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </FormGrid>

      <Text weight="semibold">C/O (Certificate of Origin)</Text>

      <TextInput
        label="Mã C/O"
        placeholder="Do hải quan cấp, tự nhập"
        value={values.coNumber}
        onChange={(value) => setField('coNumber', value)}
        isOptional
        status={fieldStatuses.coNumber}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />

      {isReadOnly ? (
        <MetadataList columns={2} label={{ position: 'top' }}>
          <MetadataListItem label="Ngày khai C/O">
            {orDash(values.coDeclarationDate)}
          </MetadataListItem>
          <MetadataListItem label="Ngày có C/O">
            {orDash(values.coIssuedDate)}
          </MetadataListItem>
        </MetadataList>
      ) : (
        <FormGrid>
          <StackItem size="fill">
            <DateInput
              label="Ngày khai C/O"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.coDeclarationDate || null
                )
              }
              onChange={(value) => setField('coDeclarationDate', value ?? '')}
              format="system_date"
              isOptional
              status={fieldStatuses.coDeclarationDate}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="fill">
            <DateInput
              label="Ngày có C/O"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.coIssuedDate || null
                )
              }
              onChange={(value) => setField('coIssuedDate', value ?? '')}
              format="system_date"
              isOptional
              status={fieldStatuses.coIssuedDate}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
      )}
    </FormSection>
  );
}
