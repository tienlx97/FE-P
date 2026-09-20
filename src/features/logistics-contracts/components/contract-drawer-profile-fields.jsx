'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Section } from '@astryxdesign/core/Section';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  borderVars,
  colorVars,
  radiusVars,
  spacingVars,
  typeScaleVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  BadgeDollarSign,
  Building2,
  FileCheck2,
  Landmark,
  PackageCheck,
  Scale,
} from 'lucide-react';
import { useState } from 'react';

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
import { BuyerFields } from './buyer-fields.jsx';
import { ContractBanksFields } from './contract-banks-fields.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';
import { QuickCreateCountryDialog } from './quick-create-country-dialog.jsx';
import { QuickCreatePlaceDialog } from './quick-create-place-dialog.jsx';
import { SellerPickerFields } from './seller-picker-fields.jsx';

const TWO_COLUMNS = { minWidth: 280, max: 2 };

const styles = stylex.create({
  section: {
    backgroundColor:
      'color-mix(in srgb, var(--maritime-badge-info-bg) 70%, transparent)',
    borderColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-element'],
    borderStyle: 'solid',
    borderWidth: borderVars['--border-width'],
    margin: 0,
    maxWidth: '100%',
    width: '100%',
  },
  sectionHeader: {
    borderBottomColor: colorVars['--color-border'],
    borderBottomStyle: 'solid',
    borderBottomWidth: borderVars['--border-width'],
    paddingBottom: spacingVars['--spacing-2'],
  },
  sectionIcon: {
    color: colorVars['--color-accent'],
  },
  eyebrow: {
    fontSize: typeScaleVars['--text-heading-4-size'],
    letterSpacing: '0.04em',
    lineHeight: typeScaleVars['--text-heading-4-leading'],
    textTransform: 'uppercase',
  },
  partyCard: {
    backgroundColor: colorVars['--color-background-surface'],
    borderColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-inner'],
    borderStyle: 'solid',
    borderWidth: borderVars['--border-width'],
  },
  hidden: { display: 'none' },
});

/** @param {{value: string, label: string}[]} options @param {string} value */
function withSavedOption(options, value) {
  return value && !options.some((option) => option.value === value)
    ? [...options, { value, label: value }]
    : options;
}

/**
 * Figma-shaped form region built from Astryx `Section`, not a hand-rolled
 * layout container. The blue wash and hairline boundary are scoped to this
 * Maritime editor and use theme tokens so they remain mechanically themeable.
 * @param {{ index: number, title: string, meta?: string, icon: import('lucide-react').LucideIcon, children: import('react').ReactNode }} props
 */
function DrawerSection({ index, title, meta, icon, children }) {
  return (
    <Section variant="transparent" padding={4} xstyle={styles.section}>
      <VStack gap={3} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          xstyle={styles.sectionHeader}
        >
          <HStack gap={2} vAlign="center">
            <Icon icon={icon} size="sm" xstyle={styles.sectionIcon} />
            <Heading level={3} xstyle={styles.eyebrow}>
              {index}. {title}
            </Heading>
          </HStack>
          {meta ? (
            <Text type="supporting" color="secondary">
              {meta}
            </Text>
          ) : null}
        </HStack>
        {children}
      </VStack>
    </Section>
  );
}

/**
 * Contract profile composed for the selected Figma drawer. It intentionally
 * consumes the existing `useContractForm` result directly: validation,
 * lookup, dirty-state and payload behavior remain owned by the established
 * hook while this component only changes presentation and field grouping.
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
    isPlaceOfDischargeApplicable,
    dischargePlaces,
    sellerExtraFieldRows,
    buyerExtraFieldRows,
    banks,
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

  return (
    <form
      id={formId}
      hidden={!isActive}
      onSubmit={(event) => {
        event.currentTarget.scrollIntoView({ block: 'start' });
        onSubmit(event);
      }}
      {...stylex.props(!isActive && styles.hidden)}
    >
      <VStack gap={5} hAlign="stretch">
        {submitError ? (
          <Banner status="error" title={submitError} container="card" />
        ) : null}

        <DrawerSection
          index={1}
          title="Thông tin chung & pháp lý"
          meta="Bắt buộc"
          icon={Scale}
        >
          <Grid columns={TWO_COLUMNS} gap={4}>
            <TextInput
              label="Số hợp đồng"
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
        </DrawerSection>

        <DrawerSection
          index={2}
          title="Giá trị tài chính & Incoterm"
          meta="Tiền tệ & cảng"
          icon={BadgeDollarSign}
        >
          <Grid columns={TWO_COLUMNS} gap={4}>
            <FormattedNumberTextInput
              label="Giá trị hợp đồng"
              value={values.contractValue}
              onChange={(value) => setField('contractValue', value)}
              units={values.currency || undefined}
              isRequired
              status={fieldStatuses.contractValue}
              statusVariant="tooltip"
            />
            <Selector
              label="Tiền tệ"
              placeholder="Chọn tiền tệ"
              value={values.currency}
              onChange={(value) => setField('currency', value ?? '')}
              options={currencyOptions}
              isRequired
              status={fieldStatuses.currency}
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
            <TextInput
              label="Hạng mục"
              value={values.category}
              onChange={(value) => setField('category', value)}
              isRequired
              status={fieldStatuses.category}
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
          </Grid>
          <Grid columns={TWO_COLUMNS} gap={4}>
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
                isDisabled={!vietnamCountryId}
                onClick={() => setIsQuickCreateLoadingPlaceOpen(true)}
              />
            </HStack>
          </Grid>
          <HStack gap={2} vAlign="end">
            <StackItem size="fill">
              <Selector
                label="Cảng / nơi đến"
                hasSearch
                placeholder="Chọn cảng / nơi đến"
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
              isDisabled={!isPlaceOfDischargeApplicable || !values.countryId}
              onClick={() => setIsQuickCreateDischargePlaceOpen(true)}
            />
          </HStack>
        </DrawerSection>

        <DrawerSection
          index={3}
          title="Các bên tham gia hợp đồng"
          icon={Building2}
        >
          <Section variant="transparent" padding={3} xstyle={styles.partyCard}>
            <VStack gap={3} hAlign="stretch">
              <Heading level={4}>Bên bán · Seller</Heading>
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
              />
            </VStack>
          </Section>
          <Section variant="transparent" padding={3} xstyle={styles.partyCard}>
            <VStack gap={3} hAlign="stretch">
              <Heading level={4}>Bên mua · Buyer</Heading>
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
              />
            </VStack>
          </Section>
        </DrawerSection>

        <DrawerSection
          index={4}
          title="Tình trạng ký kết & xác thực"
          meta={
            values.sellerSigned && values.buyerSigned
              ? 'Đã hợp lệ'
              : 'Chưa hoàn tất'
          }
          icon={FileCheck2}
        >
          <Grid columns={TWO_COLUMNS} gap={4}>
            <Section
              variant="transparent"
              padding={3}
              xstyle={styles.partyCard}
            >
              <CheckboxInput
                label="Bên bán đã ký"
                value={values.sellerSigned}
                onChange={(checked) => setField('sellerSigned', checked)}
              />
            </Section>
            <Section
              variant="transparent"
              padding={3}
              xstyle={styles.partyCard}
            >
              <CheckboxInput
                label="Bên mua đã ký"
                value={values.buyerSigned}
                onChange={(checked) => setField('buyerSigned', checked)}
              />
            </Section>
          </Grid>
        </DrawerSection>

        <DrawerSection
          index={5}
          title="Ngân hàng & điều khoản thanh toán"
          meta={`${values.bankIds.length} tài khoản`}
          icon={Landmark}
        >
          <ContractBanksFields
            banks={banks}
            selectedBankIds={values.bankIds}
            onChange={setBankIds}
            status={fieldStatuses.bankIds}
          />
          <PaymentTermsFields
            rows={paymentTermRows.rows}
            totalPercent={paymentTermRows.totalPercent}
            status={fieldStatuses.paymentTerms}
            contractValue={values.contractValue}
            currency={values.currency}
            onAddRow={paymentTermRows.addRow}
            onRemoveRow={paymentTermRows.removeRow}
            onUpdateRowField={paymentTermRows.updateRowField}
          />
        </DrawerSection>

        <DrawerSection
          index={6}
          title="Quy chuẩn đóng gói & ghi chú"
          icon={PackageCheck}
        >
          <TextArea
            label="Ghi chú"
            isLabelHidden
            value={values.note}
            onChange={(value) => setField('note', value)}
            placeholder="Nhập quy chuẩn đóng gói, chất lượng hoặc ghi chú hợp đồng..."
            isOptional
            maxLength={2000}
            status={fieldStatuses.note}
            statusVariant="tooltip"
          />
        </DrawerSection>

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
      </VStack>
    </form>
  );
}
