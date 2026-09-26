'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { Check, CircleCheck, Plus, ReceiptText, Search } from 'lucide-react';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  groupMeaning,
  matchingFee,
  recommendedFees,
} from '../config/cost-item-templates.js';
import { formatVndAmount } from '../config/currencies.js';
import { useShipmentCostItemTemplatesQuery } from '../hooks/use-shipment-cost-item-templates-query.js';
import { useShipmentCostLineForm } from '../hooks/use-shipment-cost-line-form.js';

// Figma 125:11995 is 640px; widened on request (roomier cards / text).
const DRAWER_WIDTH = 800;
const NAME_MAX = 200;
const NOTE_MAX = 500;
const TWO_COLUMNS = { minWidth: 260, max: 2 };

/** Figma 125:12089 — Cost Nature options with their hint line. */
const COST_NATURES = /** @type {const} */ ([
  {
    value: 'Standard',
    label: 'Standard',
    hint: 'Chi phí thông thường (O/F, THC, D/O…)',
  },
  {
    value: 'Abnormal',
    label: 'Abnormal',
    hint: 'Phát sinh bất thường (demurrage, detention…)',
  },
]);

/**
 * Meta drawer that adds one logistics cost line to a shipment, or edits
 * one (`costLine`) — Figma 125:11995 "Thêm chi phí logistics". Fixed
 * header (code + incoterm), a muted canvas with two boxed sections —
 * "Phân loại" (the 8 LOG groups as selectable cards, Cost Nature as two
 * option cards; each group card shows its plain meaning) and "Khoản chi
 * phí" (name, then the group's recommended fees — the LOG 01-08 catalog,
 * searchable by Vietnamese name or invoice keyword; picking one fills the
 * name and Cost Nature and shows where it occurs + its classification note
 * — then amount, invoice number, provider, note) — a live "after saving" preview,
 * and a fixed footer with the unsaved-changes hint. Closing with changes
 * asks first. Saving resends the shipment's cost list
 * (`useShipmentCostLineForm`).
 *
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   costLine?: import('../types/index.js').ShipmentCostLine | null,
 *   initialCostCategoryId?: string,
 *   incotermLabel: string,
 *   costCategories: import('../types/index.js').ShipmentCostCategory[],
 *   providers: import('../types/index.js').Customer[],
 *   onClose: () => void,
 * }} props
 */
export function ShipmentCostLineDrawer({
  contractId,
  shipment,
  costLine = null,
  initialCostCategoryId,
  incotermLabel,
  costCategories,
  providers,
  onClose,
}) {
  const formId = useId();
  const toast = useAppToast();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const isEditing = costLine !== null;
  const form = useShipmentCostLineForm({
    contractId,
    shipment,
    costLine,
    initialCostCategoryId,
    onSuccess: () => {
      toast({
        body: isEditing ? 'Đã cập nhật chi phí.' : 'Đã thêm chi phí.',
      });
      onClose();
    },
  });
  const { values, setField, fieldStatuses } = form;

  const [feeQuery, setFeeQuery] = useState('');
  const templatesQuery = useShipmentCostItemTemplatesQuery();
  const templates = templatesQuery.data?.success
    ? templatesQuery.data.costItemTemplates
    : [];
  const selectedCategory = costCategories.find(
    (category) => category.id === values.costCategoryId,
  );
  const groupFeeCount = selectedCategory
    ? recommendedFees(templates, selectedCategory.id).length
    : 0;
  const fees = selectedCategory
    ? recommendedFees(templates, selectedCategory.id, feeQuery)
    : [];
  const pickedFee = matchingFee(templates, values.costCategoryId, values.name);

  /** @param {import('../types/index.js').ShipmentCostItemTemplate} fee */
  function pickFee(fee) {
    setField('name', fee.name.slice(0, NAME_MAX));
    setField('costNature', fee.defaultCostNature);
  }

  // "After saving" preview: the other lines + this one as it stands.
  const otherCosts = shipment.costs.filter((cost) => cost.id !== costLine?.id);
  const amount = typeof values.amount === 'number' ? values.amount : 0;
  /** @param {import('../types/index.js').ShipmentCostLine[]} costs */
  const sum = (costs) => costs.reduce((total, cost) => total + cost.amount, 0);
  const groupTotal =
    sum(
      otherCosts.filter(
        (cost) => cost.costCategoryId === values.costCategoryId,
      ),
    ) + amount;
  const shipmentTotal = sum(otherCosts) + amount;
  const abnormalTotal =
    sum(otherCosts.filter((cost) => cost.costNature === 'Abnormal')) +
    (values.costNature === 'Abnormal' ? amount : 0);

  function requestClose() {
    if (form.isDirty) setIsConfirmingDiscard(true);
    else onClose();
  }

  return (
    <MetaThemeProvider>
      <Drawer
        isOpen
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        side="end"
        width={DRAWER_WIDTH}
        isFullWidthOnMobile
        label={isEditing ? 'Sửa chi phí logistics' : 'Thêm chi phí logistics'}
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={ReceiptText}
                title={
                  isEditing ? 'Sửa chi phí logistics' : 'Thêm chi phí logistics'
                }
                code={shipment.shipmentCode}
                badge={<MetaPill label={incotermLabel} tone="neutral" />}
                onClose={requestClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              <form
                id={formId}
                onSubmit={form.handleSubmit}
                noValidate
                {...stylex.props(styles.fields)}
              >
                <VStack gap={4} hAlign="stretch">
                  {form.submitError ? (
                    <Banner
                      status="error"
                      title={form.submitError}
                      container="card"
                    />
                  ) : null}

                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    title="Phân loại"
                    meta={<MetaPill label="Bắt buộc" tone="accent" />}
                  >
                    <VStack gap={3} hAlign="stretch">
                      <FieldLabel label="Nhóm chi phí" isRequired />
                      <Grid
                        columns={TWO_COLUMNS}
                        gap={3}
                        role="radiogroup"
                        aria-label="Nhóm chi phí"
                      >
                        {costCategories.map((category) => {
                          const isSelected =
                            category.id === values.costCategoryId;
                          return (
                            <SelectableCard
                              key={category.id}
                              label={`${category.code} · ${category.name}`}
                              isSelected={isSelected}
                              onChange={() => {
                                setField('costCategoryId', category.id);
                                setFeeQuery('');
                              }}
                              padding={3}
                              xstyle={[
                                styles.option,
                                isSelected && styles.optionSelected,
                              ]}
                            >
                              <VStack gap={1} hAlign="stretch">
                                <HStack
                                  hAlign="between"
                                  vAlign="center"
                                  wrap="nowrap"
                                >
                                  <Text
                                    as="span"
                                    size="sm"
                                    type="code"
                                    weight="bold"
                                    // The chip's own xstyle color wins only
                                    // over an inherited one, not a set one.
                                    color="inherit"
                                    xstyle={[
                                      styles.code,
                                      isSelected && styles.codeSelected,
                                    ]}
                                  >
                                    {category.code}
                                  </Text>
                                  {isSelected ? (
                                    <Icon
                                      icon={CircleCheck}
                                      size="md"
                                      color="accent"
                                    />
                                  ) : null}
                                </HStack>
                                <Text
                                  weight="semibold"
                                  color={isSelected ? 'accent' : 'primary'}
                                  maxLines={2}
                                >
                                  {category.name.toLocaleUpperCase('vi')}
                                </Text>
                                {category.note ? (
                                  <Text
                                    size="sm"
                                    color="secondary"
                                    maxLines={2}
                                  >
                                    {groupMeaning(category.note)}
                                  </Text>
                                ) : null}
                              </VStack>
                            </SelectableCard>
                          );
                        })}
                      </Grid>
                      <FieldError message={fieldStatuses.costCategoryId} />
                    </VStack>

                    <VStack gap={3} hAlign="stretch">
                      <FieldLabel label="Cost Nature" isRequired />
                      <Grid
                        columns={TWO_COLUMNS}
                        gap={3}
                        role="radiogroup"
                        aria-label="Cost Nature"
                      >
                        {COST_NATURES.map((nature) => {
                          const isSelected = values.costNature === nature.value;
                          const isAbnormal = nature.value === 'Abnormal';
                          return (
                            <SelectableCard
                              key={nature.value}
                              label={`${nature.label} — ${nature.hint}`}
                              isSelected={isSelected}
                              onChange={() =>
                                setField('costNature', nature.value)
                              }
                              padding={3}
                              xstyle={[
                                styles.option,
                                isSelected &&
                                  (isAbnormal
                                    ? styles.abnormalSelected
                                    : styles.optionSelected),
                              ]}
                            >
                              <HStack gap={2} vAlign="start" wrap="nowrap">
                                <HStack
                                  as="span"
                                  hAlign="center"
                                  vAlign="center"
                                  xstyle={[
                                    styles.radio,
                                    isSelected &&
                                      (isAbnormal
                                        ? styles.radioAbnormal
                                        : styles.radioStandard),
                                  ]}
                                >
                                  {isSelected ? (
                                    <HStack
                                      as="span"
                                      xstyle={styles.radioDot}
                                    />
                                  ) : null}
                                </HStack>
                                <VStack gap={0.5}>
                                  <Text
                                    weight="bold"
                                    color={
                                      isSelected && isAbnormal
                                        ? 'meta-amber'
                                        : 'primary'
                                    }
                                  >
                                    {nature.label}
                                  </Text>
                                  <Text
                                    size="sm"
                                    color={
                                      isSelected && isAbnormal
                                        ? 'meta-amber'
                                        : 'secondary'
                                    }
                                  >
                                    {nature.hint}
                                  </Text>
                                </VStack>
                              </HStack>
                            </SelectableCard>
                          );
                        })}
                      </Grid>
                    </VStack>
                  </MetaFormSection>

                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    title="Khoản chi phí"
                  >
                    <VStack gap={1} hAlign="stretch">
                      <FieldLabel
                        label="Tên khoản chi phí"
                        isRequired
                        counter={`${values.name.length}/${NAME_MAX}`}
                      />
                      <TextInput
                        label="Tên khoản chi phí"
                        isLabelHidden
                        value={values.name}
                        onChange={(value) =>
                          setField('name', value.slice(0, NAME_MAX))
                        }
                        placeholder="Chọn loại phí bên dưới hoặc tự nhập"
                        status={fieldStatuses.name}
                        statusVariant="detached"
                        width="100%"
                      />
                      {pickedFee?.note || pickedFee?.occurrencePoint ? (
                        <Text size="sm" color="secondary">
                          {[pickedFee.occurrencePoint, pickedFee.note]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      ) : null}
                    </VStack>

                    <VStack gap={2} hAlign="stretch">
                      <FieldLabel
                        label="Loại phí khuyến nghị"
                        counter={
                          selectedCategory && groupFeeCount > 0
                            ? `${fees.length}/${groupFeeCount}`
                            : undefined
                        }
                      />
                      {!selectedCategory || groupFeeCount === 0 ? (
                        <Text size="sm" color="meta-subtle">
                          {!selectedCategory
                            ? 'Chọn nhóm chi phí để xem các loại phí khuyến nghị.'
                            : `Chưa có loại phí khuyến nghị cho ${selectedCategory.code}.`}
                        </Text>
                      ) : (
                        <>
                          <TextInput
                            label="Tìm loại phí"
                            isLabelHidden
                            startIcon={Search}
                            hasClear
                            value={feeQuery}
                            onChange={setFeeQuery}
                            placeholder="Tìm theo tên hoặc từ khóa invoice (THC, demurrage…)"
                            width="100%"
                          />
                          {fees.length === 0 ? (
                            <Text size="sm" color="meta-subtle">
                              Không có loại phí nào khớp — có thể tự nhập tên ở
                              trên.
                            </Text>
                          ) : (
                            <List
                              density="compact"
                              hasDividers
                              header={
                                <Text size="sm" color="meta-subtle">
                                  Chọn một loại phí để điền tên và Cost Nature
                                </Text>
                              }
                              xstyle={styles.feeList}
                            >
                              {fees.map((fee) => (
                                <ListItem
                                  key={fee.id}
                                  label={fee.name}
                                  description={[fee.nameEn, fee.occurrencePoint]
                                    .filter(Boolean)
                                    .join(' · ')}
                                  isSelected={fee.id === pickedFee?.id}
                                  onClick={() => pickFee(fee)}
                                  endContent={
                                    fee.id === pickedFee?.id ? (
                                      <Icon
                                        icon={CircleCheck}
                                        size="md"
                                        color="accent"
                                      />
                                    ) : fee.defaultCostNature === 'Abnormal' ? (
                                      <MetaPill label="Abnormal" tone="warning" />
                                    ) : null
                                  }
                                />
                              ))}
                            </List>
                          )}
                        </>
                      )}
                    </VStack>

                    <VStack gap={1} hAlign="stretch">
                      <FieldLabel label="Số tiền" isRequired />
                      <FormattedNumberTextInput
                        label="Số tiền"
                        isLabelHidden
                        value={
                          typeof values.amount === 'number'
                            ? values.amount
                            : undefined
                        }
                        onChange={(value) =>
                          setField('amount', /** @type {number} */ (value))
                        }
                        units="đ"
                        status={fieldStatuses.amount}
                        statusVariant="detached"
                      />
                      <Text size="sm" color="meta-subtle">
                        Chỉ ghi nhận bằng VNĐ
                      </Text>
                    </VStack>

                    <Grid columns={TWO_COLUMNS} gap={3}>
                      <VStack gap={1} hAlign="stretch">
                        <FieldLabel label="Số hoá đơn" isOptional />
                        <TextInput
                          label="Số hoá đơn"
                          isLabelHidden
                          value={values.invoiceNumber}
                          onChange={(value) => setField('invoiceNumber', value)}
                          placeholder="Không bắt buộc"
                          status={fieldStatuses.invoiceNumber}
                          statusVariant="detached"
                          width="100%"
                        />
                      </VStack>
                      <VStack gap={1} hAlign="stretch">
                        <FieldLabel label="Ngày xuất hoá đơn" isOptional />
                        <DateInput
                          label="Ngày xuất hoá đơn"
                          isLabelHidden
                          value={
                            /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                              values.invoiceDate || undefined
                            )
                          }
                          onChange={(value) =>
                            setField('invoiceDate', value ?? '')
                          }
                          format={formatDateInputValue}
                          placeholder="Chọn ngày"
                        />
                      </VStack>
                    </Grid>

                    <VStack gap={1} hAlign="stretch">
                      <FieldLabel label="Nhà cung cấp" isOptional />
                      <Selector
                        label="Nhà cung cấp"
                        isLabelHidden
                        hasSearch
                        hasClear
                        placeholder="Chưa xác định"
                        value={values.providerCustomerId || null}
                        onChange={(value) =>
                          setField('providerCustomerId', value ?? '')
                        }
                        options={providers.map((provider) => ({
                          value: provider.id,
                          label: provider.companyName,
                        }))}
                        width="100%"
                      />
                    </VStack>

                    <VStack gap={1} hAlign="stretch">
                      <FieldLabel
                        label="Ghi chú"
                        isOptional
                        counter={`${values.note.length}/${NOTE_MAX}`}
                      />
                      <TextArea
                        label="Ghi chú"
                        isLabelHidden
                        value={values.note}
                        onChange={(value) =>
                          setField('note', value.slice(0, NOTE_MAX))
                        }
                        placeholder="Ghi chú (không bắt buộc)"
                        rows={2}
                        status={fieldStatuses.note}
                      />
                    </VStack>
                  </MetaFormSection>

                  {selectedCategory ? (
                    <VStack gap={0.5} hAlign="stretch" xstyle={styles.preview}>
                      <HStack
                        hAlign="between"
                        vAlign="center"
                        gap={3}
                        wrap="wrap"
                      >
                        <Text weight="medium" color="accent">
                          {selectedCategory.code}{' '}
                          {isEditing ? 'sau khi lưu' : 'sau khi thêm'}:{' '}
                          <Text as="span" weight="bold" hasTabularNumbers>
                            {formatVndAmount(groupTotal)}
                          </Text>
                        </Text>
                        <Text weight="medium">
                          Tổng chi phí Shipment:{' '}
                          <Text
                            as="span"
                            weight="bold"
                            color="accent"
                            hasTabularNumbers
                          >
                            {formatVndAmount(shipmentTotal)}
                          </Text>
                        </Text>
                      </HStack>
                      <Text size="sm" weight="medium" color="meta-amber">
                        Trong đó Abnormal: {formatVndAmount(abnormalTotal)}
                      </Text>
                    </VStack>
                  ) : null}
                </VStack>
              </form>
            </LayoutContent>
          }
          footer={
            <LayoutFooter padding={4}>
              <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
                <HStack
                  gap={2}
                  vAlign="center"
                  wrap="nowrap"
                  xstyle={styles.hint}
                >
                  {form.isDirty ? (
                    <HStack as="span" xstyle={styles.dot} />
                  ) : null}
                  <Text size="sm" color="secondary">
                    {form.isDirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  <Button
                    label="Huỷ bỏ"
                    variant="secondary"
                    size="lg"
                    isDisabled={form.isSubmitting}
                    onClick={requestClose}
                  />
                  <Button
                    label={isEditing ? 'Lưu thay đổi' : 'Thêm chi phí'}
                    type="submit"
                    form={formId}
                    variant="primary"
                    size="lg"
                    icon={<Icon icon={isEditing ? Check : Plus} size="sm" />}
                    isLoading={form.isSubmitting}
                  />
                </HStack>
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>

      <CommonDialog
        isOpen={isConfirmingDiscard}
        onOpenChange={(open) => {
          if (!open) setIsConfirmingDiscard(false);
        }}
        purpose="required"
      >
        <Layout
          header={
            <DialogHeader
              title="Bỏ thay đổi chưa lưu?"
              onOpenChange={() => setIsConfirmingDiscard(false)}
            />
          }
          content={
            <LayoutContent padding={4}>
              <Text>Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu.</Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Tiếp tục nhập"
                  variant="primary"
                  onClick={() => setIsConfirmingDiscard(false)}
                />
                <Button
                  label="Bỏ thay đổi"
                  variant="destructive"
                  onClick={() => {
                    setIsConfirmingDiscard(false);
                    onClose();
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </MetaThemeProvider>
  );
}

/**
 * Visible field label of Figma 125:12025: bold 12px, a red "*" when
 * required or a muted "(Tuỳ chọn)", and an optional mono character counter
 * on the right. The control keeps its own (visually hidden) label.
 * @param {{
 *   label: string,
 *   isRequired?: boolean,
 *   isOptional?: boolean,
 *   counter?: string,
 * }} props
 */
function FieldLabel({
  label,
  isRequired = false,
  isOptional = false,
  counter,
}) {
  return (
    <HStack hAlign="between" vAlign="center" gap={2} aria-hidden>
      <Text weight="bold">
        {label}
        {isRequired ? (
          <Text as="span" weight="bold" color="meta-danger">
            {' *'}
          </Text>
        ) : null}
        {isOptional ? (
          <Text as="span" weight="bold" color="secondary">
            {' (Tuỳ chọn)'}
          </Text>
        ) : null}
      </Text>
      {counter ? (
        <Text size="sm" type="code" color="meta-subtle" hasTabularNumbers>
          {counter}
        </Text>
      ) : null}
    </HStack>
  );
}

/**
 * Error line under a control that has no status slot of its own (the
 * group card grid).
 * @param {{ message?: { type: 'error', message: string } }} props
 */
function FieldError({ message }) {
  return message ? (
    <Text color="meta-danger" role="alert">
      {message.message}
    </Text>
  ) : null;
}

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  // Figma body: #faf8ff canvas under white section cards.
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
  },
  // Same roomy form controls as the other Meta drawers (read by the Meta
  // theme's field overrides). StyleX compiles custom-property keys; its
  // lint rule just doesn't know them.
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
  },
  option: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    height: '100%',
  },
  optionSelected: {
    backgroundColor: 'var(--meta-accent-tint)',
    borderColor: 'var(--color-accent)',
  },
  abnormalSelected: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderColor: 'var(--meta-amber-border)',
  },
  // "LOG-03" code chip (Figma 125:12031); cobalt when selected.
  code: {
    backgroundColor: 'var(--meta-neutral-pill-bg)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-text-secondary)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-1-5)',
  },
  codeSelected: {
    backgroundColor: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  radio: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    flexShrink: 0,
    height: 'var(--spacing-4)',
    marginTop: 'var(--spacing-1)',
    width: 'var(--spacing-4)',
  },
  radioStandard: {
    backgroundColor: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
  },
  radioAbnormal: {
    backgroundColor: 'var(--meta-amber-text)',
    borderColor: 'var(--meta-amber-text)',
  },
  radioDot: {
    backgroundColor: 'var(--color-background-card)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  // LOG-03 has 24 fees: about eight rows show, the rest scroll.
  feeList: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    maxHeight: 'calc(var(--spacing-10) * 8)',
    overflowY: 'auto',
  },
  preview: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
    borderColor: 'var(--meta-accent-tint-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-3)',
  },
  dot: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  hint: {
    minWidth: 0,
  },
});
