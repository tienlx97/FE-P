'use client';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormSection } from '@/shared/components/form-section.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

import { contractTypeOptions } from '../config/contract-types.js';
import { currencyOptions } from '../config/currencies.js';
import { incotermOptions } from '../config/incoterms.js';
import { BuyerFields } from './buyer-fields.jsx';
import { QuickCreateCountryDialog } from './quick-create-country-dialog.jsx';
import { QuickCreatePlaceDialog } from './quick-create-place-dialog.jsx';
import { SellerPickerFields } from './seller-picker-fields.jsx';

// Fullscreen dialog: 3 fields per row (vs 2) keeps rows from stretching
// too wide on large viewports.
const GENERAL_FIELD_COLUMNS = { minWidth: 220, max: 3 };
// Fixed-width side column so the two dates read as one grouped block,
// stacked next to the main field grid (see UX reference).
const DATE_COLUMN_WIDTH = 280;

/** @param {{ form: ReturnType<typeof import('../hooks/use-contract-form.js').useContractForm> }} props */
export function ContractGeneralFields({ form }) {
  const isNarrow = useMediaQuery('(max-width: 768px)');
  const {
    values,
    setField,
    setSellerInlineField,
    selectExistingSeller,
    switchToInlineSeller,
    setBuyerInlineField,
    selectExistingCustomer,
    switchToInlineBuyer,
    fieldStatuses,
    companies,
    isCompanyFixed,
    sellers,
    customers,
    countries,
    vietnamCountryId,
    loadingPlaces,
    isPlaceOfDischargeApplicable,
    dischargePlaces,
    sellerExtraFieldRows,
    buyerExtraFieldRows,
    isCheckingContractNumber,
  } = form;
  const [isQuickCreateCountryOpen, setIsQuickCreateCountryOpen] =
    useState(false);
  const [isQuickCreateLoadingPlaceOpen, setIsQuickCreateLoadingPlaceOpen] =
    useState(false);
  const [isQuickCreateDischargePlaceOpen, setIsQuickCreateDischargePlaceOpen] =
    useState(false);

  /** @type {Record<string, { type: 'error', message: string } | undefined>} */
  const sellerFieldStatuses = {};
  /** @type {Record<string, { type: 'error', message: string } | undefined>} */
  const buyerFieldStatuses = {};

  return (
    <FormSection value="general" title="Thông tin chung" isDisabled>
      <Stack
        gap={4}
        direction={isNarrow ? 'vertical' : 'horizontal'}
        hAlign={isNarrow ? 'stretch' : 'start'}
        vAlign="start"
      >
        <StackItem size="fill">
          <VStack gap={3} hAlign="stretch">
            <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
              <TextInput
                label="Số hợp đồng"
                value={values.contractNumber}
                onChange={(value) => setField('contractNumber', value)}
                isRequired
                isLoading={isCheckingContractNumber}
                status={fieldStatuses.contractNumber}
                statusVariant="tooltip"
              />
              <TextInput
                label="Tên dự án"
                value={values.projectName}
                onChange={(value) => setField('projectName', value)}
                isRequired
                status={fieldStatuses.projectName}
                statusVariant="tooltip"
              />
              <Selector
                label="Loại hợp đồng"
                placeholder="Chọn loại hợp đồng"
                value={values.contractType}
                onChange={(value) => setField('contractType', value ?? '')}
                options={contractTypeOptions}
                isRequired
                status={fieldStatuses.contractType}
                statusVariant="tooltip"
              />
            </Grid>

            <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
              <TextInput
                label="Hạng mục"
                value={values.category}
                onChange={(value) => setField('category', value)}
                isRequired
                status={fieldStatuses.category}
                statusVariant="tooltip"
              />
              <Selector
                label="Incoterm"
                placeholder="Chọn Incoterm"
                value={values.incoterm}
                onChange={(value) => setField('incoterm', value ?? '')}
                options={incotermOptions}
                isRequired
                status={fieldStatuses.incoterm}
                statusVariant="tooltip"
              />
              <NumberInput
                label="Năm Incoterm"
                value={values.incotermYear}
                onChange={(value) => setField('incotermYear', value)}
                isIntegerOnly
                isRequired
                status={fieldStatuses.incotermYear}
                statusVariant="tooltip"
              />
            </Grid>
          </VStack>
        </StackItem>

        <StackItem size="static">
          <VStack
            gap={3}
            hAlign="stretch"
            width={isNarrow ? '100%' : DATE_COLUMN_WIDTH}
          >
            <DateInput
              label="Ngày tạo hợp đồng"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.createdDate
                )
              }
              onChange={(value) => setField('createdDate', value ?? '')}
              format="system_date"
              isRequired
              status={fieldStatuses.createdDate}
              statusVariant="tooltip"
            />
            <DateInput
              label="Ngày báo giá"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.quotationDate
                )
              }
              onChange={(value) => setField('quotationDate', value ?? '')}
              format="system_date"
              isRequired
              status={fieldStatuses.quotationDate}
              statusVariant="tooltip"
            />
          </VStack>
        </StackItem>
      </Stack>

      <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <Selector
              label="Nước xuất khẩu"
              hasSearch
              placeholder="Chọn nước"
              value={values.countryId}
              onChange={(value) => setField('countryId', value ?? '')}
              options={countries.map((country) => ({
                value: country.id,
                label: country.name,
              }))}
              isRequired
              status={fieldStatuses.countryId}
              statusVariant="tooltip"
              width="100%"
            />
          </StackItem>
          <IconButton
            label="Thêm nước"
            tooltip="Thêm nước"
            icon={<Icon icon={IconPlus} size="sm" />}
            type="button"
            variant="secondary"
            onClick={() => setIsQuickCreateCountryOpen(true)}
          />
        </HStack>

        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <Selector
              label="Nơi xếp hàng"
              hasSearch
              placeholder="Chọn nơi xếp hàng"
              disabledMessage={
                vietnamCountryId
                  ? undefined
                  : 'Danh mục nước chưa có "Việt Nam"'
              }
              isDisabled={!vietnamCountryId}
              value={values.placeOfLoading}
              onChange={(value) => setField('placeOfLoading', value ?? '')}
              options={loadingPlaces.map((place) => ({
                value: place.name,
                label: place.name,
              }))}
              isRequired
              status={fieldStatuses.placeOfLoading}
              statusVariant="tooltip"
              width="100%"
            />
          </StackItem>
          <IconButton
            label="Thêm nơi xếp hàng"
            tooltip="Thêm nơi xếp hàng"
            icon={<Icon icon={IconPlus} size="sm" />}
            type="button"
            variant="secondary"
            isDisabled={!vietnamCountryId}
            onClick={() => setIsQuickCreateLoadingPlaceOpen(true)}
          />
        </HStack>

        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <Selector
              label="Cảng/nơi đến"
              hasSearch
              placeholder="Chọn cảng/nơi đến"
              disabledMessage={
                !isPlaceOfDischargeApplicable
                  ? 'Không áp dụng cho Incoterm EXW/FOB'
                  : !values.countryId
                    ? 'Vui lòng chọn nước xuất khẩu trước'
                    : undefined
              }
              isDisabled={!isPlaceOfDischargeApplicable || !values.countryId}
              value={values.placeOfDischarge}
              onChange={(value) => setField('placeOfDischarge', value ?? '')}
              options={dischargePlaces.map((place) => ({
                value: place.name,
                label: place.name,
              }))}
              isRequired={isPlaceOfDischargeApplicable}
              status={fieldStatuses.placeOfDischarge}
              statusVariant="tooltip"
              width="100%"
            />
          </StackItem>
          <IconButton
            label="Thêm cảng / nơi đến"
            tooltip="Thêm cảng / nơi đến"
            icon={<Icon icon={IconPlus} size="sm" />}
            type="button"
            variant="secondary"
            isDisabled={!isPlaceOfDischargeApplicable || !values.countryId}
            onClick={() => setIsQuickCreateDischargePlaceOpen(true)}
          />
        </HStack>
      </Grid>

      <QuickCreateCountryDialog
        isOpen={isQuickCreateCountryOpen}
        onOpenChange={setIsQuickCreateCountryOpen}
        onCreated={(country) => setField('countryId', country.id)}
      />

      <QuickCreatePlaceDialog
        isOpen={isQuickCreateLoadingPlaceOpen}
        onOpenChange={setIsQuickCreateLoadingPlaceOpen}
        countries={countries}
        countryId={vietnamCountryId}
        onCreated={(place) => setField('placeOfLoading', place.name)}
      />

      <QuickCreatePlaceDialog
        isOpen={isQuickCreateDischargePlaceOpen}
        onOpenChange={setIsQuickCreateDischargePlaceOpen}
        countries={countries}
        countryId={values.countryId}
        onCreated={(place) => setField('placeOfDischarge', place.name)}
      />

      <HStack gap={3} vAlign="end">
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Giá trị hợp đồng"
            value={values.contractValue}
            onChange={(value) => setField('contractValue', value)}
            units={values.currency || undefined}
            isRequired
            status={fieldStatuses.contractValue}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="static">
          <Selector
            label="Tiền tệ"
            placeholder="Đơn vị"
            value={values.currency}
            onChange={(value) => setField('currency', value ?? '')}
            options={currencyOptions}
            width={120}
            isRequired
            status={fieldStatuses.currency}
            statusVariant="tooltip"
          />
        </StackItem>
      </HStack>

      {isCompanyFixed ? (
        <Text type="supporting" color="secondary">
          Công ty:{' '}
          {companies.find((company) => company.id === values.companyId)?.name ??
            values.companyId}{' '}
          (không thể thay đổi sau khi tạo)
        </Text>
      ) : (
        <Selector
          label="Công ty"
          hasSearch
          placeholder="Chọn công ty"
          value={values.companyId}
          onChange={(value) => setField('companyId', value ?? '')}
          options={companies.map((company) => ({
            value: company.id,
            label: company.name,
          }))}
          isRequired
          status={fieldStatuses.companyId}
          statusVariant="tooltip"
          width="100%"
        />
      )}

      <TextArea
        label="Ghi chú"
        value={values.note}
        onChange={(value) => setField('note', value)}
        isOptional
        maxLength={2000}
        status={fieldStatuses.note}
        statusVariant="tooltip"
      />

      <HStack gap={4}>
        <CheckboxInput
          label="Bên bán ký"
          value={values.sellerSigned}
          onChange={(checked) => setField('sellerSigned', checked)}
        />
        <CheckboxInput
          label="Bên mua ký"
          value={values.buyerSigned}
          onChange={(checked) => setField('buyerSigned', checked)}
        />
      </HStack>

      <Text type="label" color="secondary">
        Bên bán
      </Text>
      <SellerPickerFields
        sellers={sellers}
        sourceSellerId={values.sourceSellerId}
        inlineValues={values.sellerInline}
        sourceSellerIdStatus={fieldStatuses.sourceSellerId}
        fieldStatuses={sellerFieldStatuses}
        onSelectExisting={selectExistingSeller}
        onSwitchToInline={switchToInlineSeller}
        onInlineFieldChange={setSellerInlineField}
        extraFieldRows={sellerExtraFieldRows}
      />

      <Text type="label" color="secondary">
        Buyer (Khách hàng)
      </Text>
      <BuyerFields
        customers={customers}
        sourceCustomerId={values.sourceCustomerId}
        inlineValues={values.buyerInline}
        sourceCustomerIdStatus={fieldStatuses.sourceCustomerId}
        fieldStatuses={buyerFieldStatuses}
        onSelectExisting={selectExistingCustomer}
        onSwitchToInline={switchToInlineBuyer}
        onInlineFieldChange={setBuyerInlineField}
        extraFieldRows={buyerExtraFieldRows}
      />
    </FormSection>
  );
}
