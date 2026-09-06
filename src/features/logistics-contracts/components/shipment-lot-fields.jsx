'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import { currencyOptions } from '../config/currencies.js';
import {
  labelForPaymentType,
  paymentTypeOptions,
} from '../config/payment-schedule-types.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import {
  labelForShipmentType,
  shipmentTypeOptions,
} from '../config/shipment-types.js';

/** @param {{
 * values: import('../types/index.js').ShipmentFormValues,
 * setField: <K extends keyof import('../types/index.js').ShipmentFormValues>(field: K, value: import('../types/index.js').ShipmentFormValues[K]) => void,
 * fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * isEditing: boolean,
 * derivedQuantityUnit: ReturnType<typeof import('../config/shipment-quantity-units.js').quantityUnitForShipmentType>,
 * isReadOnly?: boolean,
 * }} props */
export function ShipmentLotFields({
  values,
  setField,
  fieldStatuses,
  isEditing,
  derivedQuantityUnit,
  isReadOnly = false,
}) {
  return (
    <FormSection value="lot" title="Thông tin lô hàng">
      {isReadOnly ? (
        <MetadataList columns={2} label={{ position: 'top' }}>
          <MetadataListItem label="Tên lô hàng">
            {values.name}
          </MetadataListItem>
          <MetadataListItem label="Loại hình">
            {labelForShipmentType(values.type)}
          </MetadataListItem>
        </MetadataList>
      ) : (
        <FormGrid>
          <StackItem size="fill">
            <TextInput
              label="Tên lô hàng"
              value={values.name}
              onChange={(value) => setField('name', value)}
              isRequired
              status={fieldStatuses.name}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="static">
            <Selector
              label="Loại hình"
              placeholder="LCL/FCL"
              value={values.type}
              onChange={(value) =>
                setField(
                  'type',
                  /** @type {import('../types/index.js').ShipmentType | ''} */ (
                    value ?? ''
                  ),
                )
              }
              options={shipmentTypeOptions}
              width={140}
              isDisabled={isEditing}
              disabledMessage="Không thể đổi loại hình sau khi đã tạo"
              isRequired
              status={fieldStatuses.type}
              statusVariant="tooltip"
            />
          </StackItem>
        </FormGrid>
      )}

      {isReadOnly ? (
        <MetadataList columns={1} label={{ position: 'top' }}>
          <MetadataListItem label="Điều kiện thanh toán">
            {labelForPaymentType(values.paymentCondition)}
          </MetadataListItem>
        </MetadataList>
      ) : (
        <Selector
          label="Điều kiện thanh toán"
          placeholder="Chọn điều kiện thanh toán"
          value={values.paymentCondition}
          onChange={(value) =>
            setField(
              'paymentCondition',
              /** @type {import('../types/index.js').PaymentType | ''} */ (
                value ?? ''
              ),
            )
          }
          options={paymentTypeOptions}
          isRequired
          status={fieldStatuses.paymentCondition}
          statusVariant="tooltip"
          width="100%"
        />
      )}

      {isReadOnly ? (
        <FormattedNumberTextInput
          label="Giá trị invoice"
          value={values.invoiceValue}
          onChange={(value) => setField('invoiceValue', value)}
          units={values.invoiceCurrency || undefined}
          isReadOnly
        />
      ) : (
        <HStack gap={3} vAlign="end">
          <StackItem size="fill">
            <FormattedNumberTextInput
              label="Giá trị invoice"
              value={values.invoiceValue}
              onChange={(value) => setField('invoiceValue', value)}
              units={values.invoiceCurrency || undefined}
              isRequired
              status={fieldStatuses.invoiceValue}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="static">
            <Selector
              label="Đơn vị"
              value={values.invoiceCurrency}
              onChange={(value) => setField('invoiceCurrency', value ?? '')}
              options={currencyOptions}
              width={180}
              isRequired
              status={fieldStatuses.invoiceCurrency}
              statusVariant="tooltip"
            />
          </StackItem>
        </HStack>
      )}

      {isReadOnly ? (
        <FormattedNumberTextInput
          label="Giá trị tờ khai"
          value={values.declarationValue}
          onChange={(value) => setField('declarationValue', value)}
          units={values.declarationCurrency || undefined}
          isReadOnly
        />
      ) : (
        <HStack gap={3} vAlign="end">
          <StackItem size="fill">
            <FormattedNumberTextInput
              label="Giá trị tờ khai"
              value={values.declarationValue}
              onChange={(value) => setField('declarationValue', value)}
              units={values.declarationCurrency || undefined}
              isRequired
              status={fieldStatuses.declarationValue}
              statusVariant="tooltip"
            />
          </StackItem>
          <StackItem size="static">
            <Selector
              label="Đơn vị"
              value={values.declarationCurrency}
              onChange={(value) => setField('declarationCurrency', value ?? '')}
              options={currencyOptions}
              width={180}
              isRequired
              status={fieldStatuses.declarationCurrency}
              statusVariant="tooltip"
            />
          </StackItem>
        </HStack>
      )}

      <FormattedNumberTextInput
        label="Tỷ giá tờ khai"
        value={values.declarationExchangeRate}
        onChange={(value) => setField('declarationExchangeRate', value)}
        units="đ"
        isRequired
        status={fieldStatuses.declarationExchangeRate}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />

      <FormattedNumberTextInput
        label="Số lượng"
        value={values.quantityAmount}
        onChange={(value) => setField('quantityAmount', value)}
        units={
          derivedQuantityUnit
            ? labelForShipmentQuantityUnit(derivedQuantityUnit)
            : undefined
        }
        description={
          values.type
            ? undefined
            : 'Chọn loại hình trước để biết đơn vị (Kiện cho LCL, Cont cho FCL)'
        }
        isRequired
        status={fieldStatuses.quantityAmount}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />

      <FormattedNumberTextInput
        label="Khối lượng tờ khai"
        value={values.declarationWeightKg}
        onChange={(value) => setField('declarationWeightKg', value)}
        units="kg"
        isRequired
        status={fieldStatuses.declarationWeightKg}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />
    </FormSection>
  );
}
