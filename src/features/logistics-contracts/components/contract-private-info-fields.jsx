'use client';

import { Card } from '@astryxdesign/core/Card';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { overlayPaddingReset } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { ExtraFieldsEditor } from './extra-fields-editor.jsx';

/** @param {import('../types/index.js').ContractPrivateInfo} privateInfo */
export function isPrivateInfoEntirelyEmpty(privateInfo) {
  return [
    privateInfo.boqSentDate,
    privateInfo.containerCount,
    privateInfo.costPricePerContainer,
    privateInfo.quotedPricePerContainer,
    privateInfo.unitCostLabor,
    privateInfo.unitCostSandblasting,
    privateInfo.unitCostPainting,
    privateInfo.unitCostFactory,
    privateInfo.volumeSale,
    privateInfo.volumeMaterial,
    privateInfo.profit,
    privateInfo.totalAmountUsd,
    privateInfo.exchangeRateVnd,
  ].every((value) => value == null);
}

/**
 * One boxed sub-section (BOQ Logistics / Đơn giá vốn / Khối lượng) — same
 * plain non-collapsible `Card` convention as `CommissionFields`'s
 * `Section`.
 * @param {{ title: string, children: import('react').ReactNode }} props
 */
function Section({ title, children }) {
  return (
    <Card padding={4}>
      <VStack
        gap={3}
        hAlign="stretch"
        {...stylex.props(overlayPaddingReset.reset)}
      >
        <Text weight="semibold">{title}</Text>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * `ContractPrivateInfo` field-set — single layout shared by Xem and Sửa;
 * `isReadOnly` toggles each field's interactivity, same convention as
 * `CommissionFields`. `logisticsTotal`/`volumeDeclaration` are backend-
 * computed and never editable, so they render as plain text, not inputs.
 * @param {{
 *   isReadOnly?: boolean,
 *   values: import('../types/index.js').ContractPrivateInfoFormValues,
 *   setField: <K extends keyof import('../types/index.js').ContractPrivateInfoFormValues>(field: K, value: import('../types/index.js').ContractPrivateInfoFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   logisticsTotal: number | null,
 *   volumeDeclaration: number,
 *   extraFieldRows: ReturnType<typeof import('../hooks/use-extra-field-rows.js').useExtraFieldRows>,
 * }} props
 */
export function ContractPrivateInfoFields({
  isReadOnly = false,
  values,
  setField,
  fieldStatuses,
  logisticsTotal,
  volumeDeclaration,
  extraFieldRows,
}) {
  const isNarrow = useMediaQuery('(max-width: 640px)');

  return (
    <VStack gap={5} hAlign="stretch">
      <DateInput
        format={formatDateInputValue}
        isDisabled={isReadOnly}
        label="BOQ · Ngày gửi"
        value={
          /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
            values.boqSentDate
          )
        }
        onChange={(value) => setField('boqSentDate', value ?? '')}
        status={fieldStatuses.boqSentDate}
        statusVariant="tooltip"
        width="100%"
      />

      <Section title="Logistics">
        <Grid columns={isNarrow ? 1 : 3} gap={3}>
          <NumberInput
            isDisabled={isReadOnly}
            label="Số cont"
            value={values.containerCount}
            onChange={(value) => setField('containerCount', value)}
            isIntegerOnly
            status={fieldStatuses.containerCount}
            statusVariant="tooltip"
          />
          <FormattedNumberTextInput
            label="Giá vốn"
            value={values.costPricePerContainer}
            onChange={(value) => setField('costPricePerContainer', value)}
            units="VNĐ"
            status={fieldStatuses.costPricePerContainer}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Giá báo khách"
            value={values.quotedPricePerContainer}
            onChange={(value) => setField('quotedPricePerContainer', value)}
            units="VNĐ"
            status={fieldStatuses.quotedPricePerContainer}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
        </Grid>
        <Text color="secondary">
          Tổng = Giá báo khách × Số cont ={' '}
          {logisticsTotal == null
            ? '—'
            : `${logisticsTotal.toLocaleString('en-US')} VNĐ`}
        </Text>
      </Section>

      <Section title="Đơn giá vốn">
        <Grid columns={isNarrow ? 1 : 2} gap={3}>
          <FormattedNumberTextInput
            label="Nhân công"
            value={values.unitCostLabor}
            onChange={(value) => setField('unitCostLabor', value)}
            units="VNĐ"
            status={fieldStatuses.unitCostLabor}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Phun bi"
            value={values.unitCostSandblasting}
            onChange={(value) => setField('unitCostSandblasting', value)}
            units="VNĐ"
            status={fieldStatuses.unitCostSandblasting}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Sơn"
            value={values.unitCostPainting}
            onChange={(value) => setField('unitCostPainting', value)}
            units="VNĐ"
            status={fieldStatuses.unitCostPainting}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Nhà máy"
            value={values.unitCostFactory}
            onChange={(value) => setField('unitCostFactory', value)}
            units="VNĐ"
            status={fieldStatuses.unitCostFactory}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
        </Grid>
      </Section>

      <Section title="Khối lượng">
        <Grid columns={isNarrow ? 1 : 3} gap={3}>
          <FormattedNumberTextInput
            label="Sale"
            value={values.volumeSale}
            onChange={(value) => setField('volumeSale', value)}
            status={fieldStatuses.volumeSale}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Vật tư"
            value={values.volumeMaterial}
            onChange={(value) => setField('volumeMaterial', value)}
            status={fieldStatuses.volumeMaterial}
            statusVariant="tooltip"
            isDisabled={isReadOnly}
          />
          <FormattedNumberTextInput
            label="Tờ khai (tổng khối lượng Shipment)"
            value={volumeDeclaration}
            onChange={() => {}}
            isReadOnly
            units="kg"
          />
        </Grid>
      </Section>

      <FormattedNumberTextInput
        label="Lợi nhuận"
        value={values.profit}
        onChange={(value) => setField('profit', value)}
        units="VNĐ"
        status={fieldStatuses.profit}
        statusVariant="tooltip"
        isDisabled={isReadOnly}
      />

      <Grid columns={isNarrow ? 1 : 2} gap={3}>
        <FormattedNumberTextInput
          label="Tổng tiền"
          value={values.totalAmountUsd}
          onChange={(value) => setField('totalAmountUsd', value)}
          units="USD"
          status={fieldStatuses.totalAmountUsd}
          statusVariant="tooltip"
          isDisabled={isReadOnly}
        />
        <FormattedNumberTextInput
          label="Tỷ giá"
          value={values.exchangeRateVnd}
          onChange={(value) => setField('exchangeRateVnd', value)}
          units="VNĐ"
          status={fieldStatuses.exchangeRateVnd}
          statusVariant="tooltip"
          isDisabled={isReadOnly}
        />
      </Grid>

      <ExtraFieldsEditor
        rows={extraFieldRows.rows}
        isReadOnly={isReadOnly}
        onAddRow={extraFieldRows.addRow}
        onRemoveRow={extraFieldRows.removeRow}
        onUpdateRowField={extraFieldRows.updateRowField}
      />
    </VStack>
  );
}
