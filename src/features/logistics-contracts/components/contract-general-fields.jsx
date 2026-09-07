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
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { FormSection } from '@/shared/components/form-section.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { contractTypeOptions } from '../config/contract-types.js';
import { currencyOptions, formatMoney } from '../config/currencies.js';
import { incotermOptions } from '../config/incoterms.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
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
 * Signed amount label for one contract-annex row — `ValueChange` never
 * represents an amount change, so it gets no sign (same sign convention as
 * `commission-fields.jsx`'s `annexAmountLabel`).
 * @param {import('../types/index.js').ContractAnnex} annex
 * @param {string} currency
 */
function annexAmountLabel(annex, currency) {
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  if (annex.type === 'AmountDecrease') return `− ${formatted}`;
  return formatted;
}

/**
 * `Contract` general field-set — single layout shared by both the Xem and
 * Sửa modes of `ContractFormDialog`; `isReadOnly` toggles each field's
 * interactivity instead of switching to a separate read-only component
 * (mirrors `CommissionFields`/`ShipmentFields`). "Phụ lục hợp đồng" and
 * "Tổng cộng" are informational and have their own actions independent of
 * this form, so they render in both modes whenever `contract` exists.
 * @param {{
 *   form: ReturnType<typeof import('../hooks/use-contract-form.js').useContractForm>,
 *   contract?: import('../types/index.js').Contract | null,
 *   isReadOnly?: boolean,
 *   onAddAnnex?: () => void,
 *   onEditAnnex?: (annex: import('../types/index.js').ContractAnnex) => void,
 * }} props
 */
export function ContractGeneralFields({
  form,
  contract = null,
  isReadOnly = false,
  onAddAnnex,
  onEditAnnex,
}) {
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

  const annexesQuery = useContractAnnexesQuery(contract?.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const contractGrandTotal = (values.contractValue ?? 0) + annexesTotal;

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractAnnex & Record<string, unknown>>[]} */
  const annexColumns = [
    {
      key: 'annexCode',
      header: 'Mã phụ lục',
      width: proportional(1.2),
      renderCell: (annex) =>
        `${annex.annexCode} · ${labelForContractAnnexType(annex.type)}`,
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(120),
      renderCell: (annex) => annex.signedDate,
    },
    {
      key: 'buyerSigned',
      header: 'Mua ký',
      width: pixel(90),
      renderCell: (annex) => (annex.buyerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'sellerSigned',
      header: 'Bán ký',
      width: pixel(90),
      renderCell: (annex) => (annex.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(140),
      align: 'end',
      renderCell: (annex) => annexAmountLabel(annex, values.currency),
    },
  ];
  if (onEditAnnex) {
    annexColumns.push({
      key: 'actions',
      header: '',
      width: pixel(60),
      renderCell: (annex) => (
        <IconButton
          label={`Sửa ${annex.annexCode}`}
          tooltip="Sửa phụ lục"
          icon={<Icon icon={Pencil} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => onEditAnnex(annex)}
        />
      ),
    });
  }

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
              <Selector
                isDisabled={isReadOnly}
                label="Loại hợp đồng"
                placeholder={isReadOnly ? '—' : 'Chọn loại hợp đồng'}
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
                isReadOnly={isReadOnly}
                label="Hạng mục"
                value={values.category}
                onChange={(value) => setField('category', value)}
                isRequired
                status={fieldStatuses.category}
                statusVariant="tooltip"
              />
              <Selector
                isDisabled={isReadOnly}
                label="Incoterm"
                placeholder={isReadOnly ? '—' : 'Chọn Incoterm'}
                value={values.incoterm}
                onChange={(value) => setField('incoterm', value ?? '')}
                options={incotermOptions}
                isRequired
                status={fieldStatuses.incoterm}
                statusVariant="tooltip"
              />
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
              <DateInput
                isDisabled={isReadOnly}
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
                isDisabled={isReadOnly}
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
            </>
          </VStack>
        </StackItem>
      </Stack>

      <Grid columns={GENERAL_FIELD_COLUMNS} gap={3}>
        <HStack gap={2} vAlign="end">
          <StackItem size="fill">
            <Selector
              isDisabled={isReadOnly}
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
            <Selector
              label="Nơi xếp hàng"
              hasSearch
              placeholder={isReadOnly ? '—' : 'Chọn nơi xếp hàng'}
              disabledMessage={
                vietnamCountryId
                  ? undefined
                  : 'Danh mục nước chưa có "Việt Nam"'
              }
              isDisabled={isReadOnly || !vietnamCountryId}
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
                isReadOnly || !isPlaceOfDischargeApplicable || !values.countryId
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

      <Selector
        isDisabled={isReadOnly}
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

      <Selector
        isDisabled={isReadOnly || isCompanyFixed}
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

      {contract ? (
        <>
          <HStack hAlign="between" vAlign="center">
            <Text weight="semibold">Phụ lục hợp đồng</Text>
            {onAddAnnex ? (
              <IconButton
                label="Thêm phụ lục"
                tooltip="Thêm phụ lục"
                icon={<Icon icon={IconPlus} size="sm" />}
                variant="secondary"
                size="sm"
                onClick={onAddAnnex}
              />
            ) : null}
          </HStack>

          {annexes.length === 0 ? (
            <Text color="secondary">Chưa có phụ lục</Text>
          ) : (
            <Table
              columns={annexColumns}
              data={annexes}
              idKey="id"
              dividers="rows"
              density="compact"
            />
          )}

          <HStack hAlign="between" vAlign="center">
            <Text weight="semibold">Tổng cộng:</Text>
            <Text weight="semibold">
              {formatMoney(contractGrandTotal, values.currency)}
            </Text>
          </HStack>
        </>
      ) : null}
    </FormSection>
  );
}
