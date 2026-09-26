'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormCard,
  MetaFormSection,
  MetaPill,
  MetaTintButton,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { NumberInput } from '@/shared/components/number-input.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { contractStatusOptions } from '../config/contract-status.js';
import { contractTypeOptions } from '../config/contract-types.js';
import { currencyOptions } from '../config/currencies.js';
import { incotermOptions } from '../config/incoterms.js';
import { withSavedOption } from '../config/place-options.js';
import { BuyerFields } from './buyer-fields.jsx';
import { ContractDrawerPaymentTerms } from './contract-drawer-payment-terms.jsx';
import { QuickCreateCountryDialog } from './quick-create-country-dialog.jsx';
import { QuickCreatePortDialog } from './quick-create-port-dialog.jsx';
import { SellerPickerFields } from './seller-picker-fields.jsx';

const TWO_COLUMNS = { minWidth: 240, max: 2 };
const CURRENCY_WIDTH = 104;

const styles = stylex.create({
  hidden: { display: 'none' },
  // Contract identifiers read in bold.
  code: { fontWeight: 'var(--font-weight-bold)' },
  // Figma 103:4983 form controls are rounded rectangles, not the Meta
  // list's pill selectors (read by the Meta theme's field overrides).
  // StyleX compiles custom-property keys; its lint rule just doesn't know
  // them.
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
  },
});

/**
 * Contract profile laid out as the Meta "Chỉnh sửa hợp đồng" drawer (Figma
 * 103:4983): 1. general & legal · 2. value, Incoterm & places · 3. parties
 * (each with its own "Đã ký kết" check) · 4. payment terms incl. beneficiary
 * banks · 5. packing notes. It consumes the existing `useContractForm`
 * result directly: validation, lookup, dirty-state and payload behavior
 * remain owned by the hook; this component only owns presentation.
 * @param {{
 *   form: ReturnType<typeof import('../hooks/use-contract-form.js').useContractForm>,
 *   formId: string,
 *   isActive: boolean,
 *   onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => void,
 * }} props
 */
export function ContractDrawerProfileFields({
  form,
  formId,
  isActive,
  onSubmit,
}) {
  const {
    values,
    setField,
    setSellerInlineField,
    selectExistingSeller,
    switchToInlineSeller,
    setBuyerInlineField,
    selectExistingCustomer,
    switchToInlineBuyer,
    setBankIds,
    fieldStatuses,
    companies,
    isCompanyFixed,
    sellers,
    customers,
    countries,
    vietnamCountryId,
    loadingPlaces,
    isPlaceOfDeliveryApplicable,
    dischargePlaces,
    sellerExtraFieldRows,
    buyerExtraFieldRows,
    banks,
    selectedSeller,
    addSellerBankAccount,
    paymentTermRows,
    submitError,
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
  const buyerCountryName = countries.find(
    (country) => country.id === values.countryId,
  )?.name;

  return (
    <form
      id={formId}
      hidden={!isActive}
      onSubmit={(event) => {
        event.currentTarget.scrollIntoView({ block: 'start' });
        onSubmit(event);
      }}
      {...stylex.props(styles.fields, !isActive && styles.hidden)}
    >
      <VStack gap={8} hAlign="stretch">
        {submitError ? (
          <Banner status="error" title={submitError} container="card" />
        ) : null}

        <MetaFormSection
          index={1}
          title="Thông tin chung & pháp lý"
          meta="Bắt buộc"
        >
          <Grid columns={TWO_COLUMNS} gap={4}>
            <TextInput
              label="Số hợp đồng"
              xstyle={styles.code}
              value={values.contractNumber}
              onChange={(value) => setField('contractNumber', value)}
              isRequired
              isLoading={isCheckingContractNumber}
              status={fieldStatuses.contractNumber}
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
          <TextInput
            label="Tên dự án"
            value={values.projectName}
            onChange={(value) => setField('projectName', value)}
            isRequired
            status={fieldStatuses.projectName}
            statusVariant="tooltip"
          />
          <ReadOnlyLock isActive={isCompanyFixed}>
            <Selector
              isDisabled={isCompanyFixed}
              disabledMessage="Không thể thay đổi công ty sau khi tạo"
              label="Công ty"
              hasSearch
              placeholder="Chọn công ty"
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
          <Grid columns={TWO_COLUMNS} gap={4}>
            <DateInput
              label="Ngày ký hợp đồng"
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
            <DateInput
              label="Ngày hoàn thành dự án"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.projectCompletionDate || null
                )
              }
              onChange={(value) =>
                setField('projectCompletionDate', value ?? '')
              }
              format={formatDateInputValue}
              isOptional
              isDisabled={values.status !== 'Completed'}
              disabledMessage={
                values.status !== 'Completed'
                  ? 'Chỉ nhập được khi trạng thái là "Đã hoàn thành"'
                  : undefined
              }
              status={fieldStatuses.projectCompletionDate}
              statusVariant="tooltip"
            />
            <Selector
              label="Trạng thái hợp đồng"
              value={values.status}
              onChange={(value) => setField('status', value ?? '')}
              options={contractStatusOptions}
              isRequired
              status={fieldStatuses.status}
              statusVariant="tooltip"
            />
          </Grid>
        </MetaFormSection>

        <MetaFormSection
          index={2}
          title="Giá trị tài chính, Incoterm & địa điểm"
          meta="Thông tin cốt lõi"
        >
          <Grid columns={TWO_COLUMNS} gap={4}>
            <HStack gap={2} vAlign="end" wrap="nowrap">
              <StackItem size="fill">
                <FormattedNumberTextInput
                  label="Giá trị hợp đồng"
                  value={values.contractValue}
                  onChange={(value) => setField('contractValue', value)}
                  isRequired
                  status={fieldStatuses.contractValue}
                  statusVariant="tooltip"
                />
              </StackItem>
              <Selector
                label="Tiền tệ"
                isLabelHidden
                placeholder="Tiền tệ"
                value={values.currency}
                onChange={(value) => setField('currency', value ?? '')}
                options={currencyOptions}
                isRequired
                status={fieldStatuses.currency}
                statusVariant="tooltip"
                hasSearch
                width={CURRENCY_WIDTH}
              />
            </HStack>
            <TextInput
              label="Hạng mục / Danh mục hàng hoá"
              value={values.category}
              onChange={(value) => setField('category', value)}
              isRequired
              status={fieldStatuses.category}
              statusVariant="tooltip"
            />
            <Selector
              label="Điều kiện Incoterm"
              placeholder="Chọn Incoterm"
              value={values.incoterm}
              onChange={(value) => setField('incoterm', value ?? '')}
              options={incotermOptions}
              isRequired
              status={fieldStatuses.incoterm}
              statusVariant="tooltip"
              hasSearch
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
          <HStack gap={2} vAlign="end">
            <StackItem size="fill">
              <Selector
                label="Nước xuất khẩu / Quốc gia đến (Country)"
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
              size="lg"
              variant="secondary"
              onClick={() => setIsQuickCreateCountryOpen(true)}
            />
          </HStack>
          <HStack gap={2} vAlign="end">
            <StackItem size="fill">
              <Selector
                label="Nơi xếp hàng / Cảng đi (Place of Loading)"
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
                options={withSavedOption(
                  loadingPlaces.map((place) => ({
                    value: place.name,
                    label: place.label,
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
              size="lg"
              variant="secondary"
              isDisabled={!vietnamCountryId}
              onClick={() => setIsQuickCreateLoadingPlaceOpen(true)}
            />
          </HStack>
          <HStack gap={2} vAlign="end">
            <StackItem size="fill">
              <Selector
                label="Cảng đến (Place of Discharge)"
                hasSearch
                placeholder="Chọn cảng đến"
                disabledMessage={
                  !values.countryId
                    ? 'Vui lòng chọn nước xuất khẩu trước'
                    : undefined
                }
                isDisabled={!values.countryId}
                value={values.placeOfDischarge}
                onChange={(value) => setField('placeOfDischarge', value ?? '')}
                options={withSavedOption(
                  dischargePlaces.map((place) => ({
                    value: place.name,
                    label: place.label,
                  })),
                  values.placeOfDischarge,
                )}
                isRequired
                status={fieldStatuses.placeOfDischarge}
                statusVariant="tooltip"
                width="100%"
              />
            </StackItem>
            <IconButton
              label="Thêm cảng đến"
              tooltip="Thêm cảng đến"
              icon={<Icon icon={IconPlus} size="sm" />}
              type="button"
              size="lg"
              variant="secondary"
              isDisabled={!values.countryId}
              onClick={() => setIsQuickCreateDischargePlaceOpen(true)}
            />
          </HStack>
          {/* DDP delivers on from the port to the buyer's site. */}
          {isPlaceOfDeliveryApplicable ? (
            <TextInput
              label="Nơi giao hàng (Place of Delivery)"
              placeholder="VD: Công trình ABC, địa chỉ…"
              value={values.placeOfDelivery}
              onChange={(value) => setField('placeOfDelivery', value)}
              isRequired
              status={fieldStatuses.placeOfDelivery}
              statusVariant="tooltip"
            />
          ) : null}
        </MetaFormSection>

        <MetaFormSection index={3} title="Các bên tham gia hợp đồng">
          <MetaFormCard
            variant="default"
            header={
              <>
                <MetaPill label="BÊN BÁN (SELLER)" tone="accent" />
                <CheckboxInput
                  label="Đã ký kết hợp đồng"
                  size="sm"
                  value={values.sellerSigned}
                  onChange={(checked) => setField('sellerSigned', checked)}
                />
              </>
            }
          >
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
              isDetailsCollapsible={false}
              actionSize="lg"
            />
          </MetaFormCard>
          <MetaFormCard
            variant="default"
            header={
              <>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <MetaPill label="BÊN MUA (BUYER)" tone="neutral" />
                  {buyerCountryName ? (
                    <MetaPill
                      label={buyerCountryName.toLocaleUpperCase('vi')}
                      tone="accent"
                    />
                  ) : null}
                </HStack>
                <CheckboxInput
                  label="Đã ký kết hợp đồng"
                  size="sm"
                  value={values.buyerSigned}
                  onChange={(checked) => setField('buyerSigned', checked)}
                />
              </>
            }
          >
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
              isDetailsCollapsible={false}
              actionSize="lg"
            />
          </MetaFormCard>
        </MetaFormSection>

        <MetaFormSection
          index={4}
          title="Điều khoản thanh toán (Payment Terms)"
          action={
            <MetaTintButton
              label="Thêm điều khoản"
              icon={<Icon icon={CirclePlus} size="sm" />}
              type="button"
              onClick={paymentTermRows.addRow}
            />
          }
        >
          <ContractDrawerPaymentTerms
            rows={paymentTermRows.rows}
            totalPercent={paymentTermRows.totalPercent}
            status={fieldStatuses.paymentTerms}
            contractValue={values.contractValue}
            currency={values.currency}
            onRemoveRow={paymentTermRows.removeRow}
            onUpdateRowField={paymentTermRows.updateRowField}
            banks={banks}
            selectedBankIds={values.bankIds}
            onBankIdsChange={setBankIds}
            bankStatus={fieldStatuses.bankIds}
            sellerName={selectedSeller?.companyName}
            onAddBankAccount={addSellerBankAccount}
          />
        </MetaFormSection>

        <TextArea
          label="5. Quy chuẩn đóng gói & Ghi chú vận hành"
          rows={3}
          value={values.note}
          onChange={(value) => setField('note', value)}
          placeholder="Nhập quy chuẩn đóng gói, chất lượng hoặc ghi chú hợp đồng..."
          isOptional
          maxLength={2000}
          status={fieldStatuses.note}
          statusVariant="tooltip"
        />

        <QuickCreateCountryDialog
          isOpen={isQuickCreateCountryOpen}
          onOpenChange={setIsQuickCreateCountryOpen}
          onCreated={(country) => setField('countryId', country.id)}
        />
        <QuickCreatePortDialog
          isOpen={isQuickCreateLoadingPlaceOpen}
          onOpenChange={setIsQuickCreateLoadingPlaceOpen}
          countries={countries}
          countryId={vietnamCountryId}
          onCreated={(port) =>
            setField('placeOfLoading', port.fullName || port.name)
          }
        />
        <QuickCreatePortDialog
          isOpen={isQuickCreateDischargePlaceOpen}
          onOpenChange={setIsQuickCreateDischargePlaceOpen}
          countries={countries}
          countryId={values.countryId}
          onCreated={(port) =>
            setField('placeOfDischarge', port.fullName || port.name)
          }
        />
      </VStack>
    </form>
  );
}
