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

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import {
  formatDateInputValue,
} from '@/shared/config/date-input-format.js';

import { contractStatusOptions } from '../config/contract-status.js';
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

/** Preserve a saved value while its lookup is loading or unavailable.
 * @param {{value: string, label: string}[]} options
 * @param {string} value
 */
function withSavedOption(options, value) {
  return value && !options.some((option) => option.value === value)
    ? [...options, { value, label: value }]
    : options;
}

/**
 * `Contract` general field-set — single layout shared by both the Xem and
 * Sửa modes of `ContractFormDialog`; `isReadOnly` toggles each field's
 * interactivity instead of switching to a separate read-only component
 * (mirrors `CommissionFields`/`ShipmentFields`). Annexes have their own
 * "Phụ lục" tab now (`ContractAnnexesPanel`, task 3.1) — this component no
 * longer renders them.
 * @param {{
 *   form: ReturnType<typeof import('../hooks/use-contract-form.js').useContractForm>,
 *   isReadOnly?: boolean,
 * }} props
 */
export function ContractGeneralFields({ form, isReadOnly = false }) {
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
                isReadOnly={isReadOnly}
                label="Số hợp đồng"
                value={values.contractNumber}
                onChange={(value) => setField('contractNumber', value)}
                isRequired
                isLoading={isCheckingContractNumber}
                status={fieldStatuses.contractNumber}
                statusVariant="tooltip"
              />
              <TextInput
                isReadOnly={isReadOnly}
                label="Tên dự án"
                value={values.projectName}
                onChange={(value) => setField('projectName', value)}
                isRequired
                status={fieldStatuses.projectName}
                statusVariant="tooltip"
              />
              <ReadOnlyLock isActive={isReadOnly}>
                <Selector
                  label="Loại hợp đồng"
                  placeholder={isReadOnly ? '—' : 'Chọn loại hợp đồng'}
                  value={values.contractType}
                  onChange={(value) => setField('contractType', value ?? '')}
                  options={contractTypeOptions}
                  isRequired
                  status={fieldStatuses.contractType}
                  statusVariant="tooltip"
                />
              </ReadOnlyLock>
            </Grid>

            <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
              <TextInput
                isReadOnly={isReadOnly}
                label="Hạng mục"
                value={values.category}
                onChange={(value) => setField('category', value)}
                isRequired
                status={fieldStatuses.category}
                statusVariant="tooltip"
              />
              <ReadOnlyLock isActive={isReadOnly}>
                <Selector
                  label="Incoterm"
                  placeholder={isReadOnly ? '—' : 'Chọn Incoterm'}
                  value={values.incoterm}
                  onChange={(value) => setField('incoterm', value ?? '')}
                  options={incotermOptions}
                  isRequired
                  status={fieldStatuses.incoterm}
                  statusVariant="tooltip"
                />
              </ReadOnlyLock>
              <NumberInput
                isReadOnly={isReadOnly}
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
            <>
              <ReadOnlyLock isActive={isReadOnly}>
                <DateInput
                  label="Ngày tạo hợp đồng"
                  value={
                    /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                      values.createdDate
                    )
                  }
                  onChange={(value) => setField('createdDate', value ?? '')}
                  format={formatDateInputValue}
                  isRequired
                  status={fieldStatuses.createdDate}
                  statusVariant="tooltip"
                />
              </ReadOnlyLock>
              <ReadOnlyLock isActive={isReadOnly}>
                <DateInput
                  label="Ngày báo giá"
                  value={
                    /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                      values.quotationDate
                    )
                  }
                  onChange={(value) => setField('quotationDate', value ?? '')}
                  format={formatDateInputValue}
                  isRequired
                  status={fieldStatuses.quotationDate}
                  statusVariant="tooltip"
                />
              </ReadOnlyLock>
            </>
          </VStack>
        </StackItem>
      </Stack>

      <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <ReadOnlyLock isActive={isReadOnly}>
              <Selector
                label="Nước xuất khẩu"
                hasSearch
                placeholder={isReadOnly ? '—' : 'Chọn nước'}
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
            </ReadOnlyLock>
          </StackItem>
          <IconButton
            isDisabled={isReadOnly}
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
            <ReadOnlyLock isActive={isReadOnly}>
              <Selector
                label="Nơi xếp hàng"
                hasSearch
                placeholder={isReadOnly ? '—' : 'Chọn nơi xếp hàng'}
                disabledMessage={
                  vietnamCountryId
                    ? undefined
                    : 'Danh mục nước chưa có "Việt Nam"'
                }
                isDisabled={!isReadOnly && !vietnamCountryId}
                value={values.placeOfLoading}
                onChange={(value) => setField('placeOfLoading', value ?? '')}
                options={withSavedOption(
                  loadingPlaces.map((place) => ({
                    value: place.name,
                    label: place.name,
                  })),
                  values.placeOfLoading,
                )}
                isRequired
                status={fieldStatuses.placeOfLoading}
                statusVariant="tooltip"
                width="100%"
              />
            </ReadOnlyLock>
          </StackItem>
          <IconButton
            label="Thêm nơi xếp hàng"
            tooltip="Thêm nơi xếp hàng"
            icon={<Icon icon={IconPlus} size="sm" />}
            type="button"
            variant="secondary"
            isDisabled={isReadOnly || !vietnamCountryId}
            onClick={() => setIsQuickCreateLoadingPlaceOpen(true)}
          />
        </HStack>

        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <ReadOnlyLock isActive={isReadOnly}>
              <Selector
                label="Cảng/nơi đến"
                hasSearch
                placeholder={isReadOnly ? '—' : 'Chọn cảng/nơi đến'}
                disabledMessage={
                  !isPlaceOfDischargeApplicable
                    ? 'Không áp dụng cho Incoterm EXW/FOB'
                    : !values.countryId
                      ? 'Vui lòng chọn nước xuất khẩu trước'
                      : undefined
                }
                isDisabled={
                  !isReadOnly &&
                  (!isPlaceOfDischargeApplicable || !values.countryId)
                }
                value={values.placeOfDischarge}
                onChange={(value) => setField('placeOfDischarge', value ?? '')}
                options={withSavedOption(
                  dischargePlaces.map((place) => ({
                    value: place.name,
                    label: place.name,
                  })),
                  values.placeOfDischarge,
                )}
                isRequired={isPlaceOfDischargeApplicable}
                status={fieldStatuses.placeOfDischarge}
                statusVariant="tooltip"
                width="100%"
              />
            </ReadOnlyLock>
          </StackItem>
          <IconButton
            label="Thêm cảng / nơi đến"
            tooltip="Thêm cảng / nơi đến"
            icon={<Icon icon={IconPlus} size="sm" />}
            type="button"
            variant="secondary"
            isDisabled={
              isReadOnly || !isPlaceOfDischargeApplicable || !values.countryId
            }
            onClick={() => setIsQuickCreateDischargePlaceOpen(true)}
          />
        </HStack>
      </Grid>

      {isReadOnly ? null : (
        <>
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
        </>
      )}

      <FormGrid>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Giá trị hợp đồng"
            value={values.contractValue}
            onChange={(value) => setField('contractValue', value)}
            units={values.currency || undefined}
            isRequired
            status={fieldStatuses.contractValue}
            statusVariant="tooltip"
            isReadOnly={isReadOnly}
          />
        </StackItem>
        <StackItem size="static">
          <ReadOnlyLock isActive={isReadOnly}>
            <Selector
              label="Tiền tệ"
              placeholder={isReadOnly ? '—' : 'Đơn vị'}
              value={values.currency}
              onChange={(value) => setField('currency', value ?? '')}
              options={currencyOptions}
              width={120}
              isRequired
              status={fieldStatuses.currency}
              statusVariant="tooltip"
            />
          </ReadOnlyLock>
        </StackItem>
      </FormGrid>

      {/* Fixed after creation regardless of Xem/Sửa (backend never accepts
          a changed CompanyId on update) — `isDisabled` still applies its
          own dimmed+tooltip treatment while editing (`isCompanyFixed`), but
          Xem itself always goes through `ReadOnlyLock` like every other
          field so the value reads the same (full opacity, copyable) as the
          rest of the "Thông tin" tab. */}
      <ReadOnlyLock isActive={isReadOnly}>
        <Selector
          isDisabled={!isReadOnly && isCompanyFixed}
          disabledMessage={
            isCompanyFixed ? 'Không thể thay đổi công ty sau khi tạo' : undefined
          }
          label="Công ty"
          hasSearch
          placeholder={isReadOnly ? '—' : 'Chọn công ty'}
          value={values.companyId}
          onChange={(value) => setField('companyId', value ?? '')}
          options={withSavedOption(
            companies.map((company) => ({
              value: company.id,
              label: company.name,
            })),
            values.companyId,
          )}
          isRequired
          status={fieldStatuses.companyId}
          statusVariant="tooltip"
          width="100%"
        />
      </ReadOnlyLock>

      <ReadOnlyLock isActive={isReadOnly}>
        <Selector
          label="Trạng thái hợp đồng"
          placeholder={isReadOnly ? '—' : 'Chọn trạng thái'}
          value={values.status}
          onChange={(value) => setField('status', value ?? '')}
          options={contractStatusOptions}
          isRequired
          status={fieldStatuses.status}
          statusVariant="tooltip"
          width="100%"
        />
      </ReadOnlyLock>

      <TextArea
        label="Ghi chú"
        value={values.note}
        onChange={(value) => setField('note', value)}
        isOptional
        maxLength={2000}
        status={fieldStatuses.note}
        statusVariant="tooltip"
        isReadOnly={isReadOnly}
      />

      <HStack gap={4}>
        <CheckboxInput
          label="Bên bán ký"
          value={values.sellerSigned}
          onChange={(checked) => setField('sellerSigned', checked)}
          isReadOnly={isReadOnly}
        />
        <CheckboxInput
          label="Bên mua ký"
          value={values.buyerSigned}
          onChange={(checked) => setField('buyerSigned', checked)}
          isReadOnly={isReadOnly}
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
        isReadOnly={isReadOnly}
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
        isReadOnly={isReadOnly}
      />

    </FormSection>
  );
}
