'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { ComplexSelector } from '@astryxdesign/core/ComplexSelector';
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
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { Check, Plus, ReceiptText, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { RichTextNoteField } from '@/shared/components/rich-text-note-field.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { groupMeaning, matchingFee } from '../config/cost-item-templates.js';
import { formatVndAmount } from '../config/currencies.js';
import {
  useCreateShipmentCostItemTemplateMutation,
  useShipmentCostItemTemplatesQuery,
} from '../hooks/use-shipment-cost-item-templates-query.js';
import { useShipmentCostLineForm } from '../hooks/use-shipment-cost-line-form.js';
import { ShipmentRecommendedFeeDrawer } from './shipment-recommended-fee-drawer.jsx';

// Figma 125:11995 is 640px; widened on request (roomier cards / text).
const DRAWER_WIDTH = 800;
const NAME_MAX = 200;
const NOTE_MAX = 2000;
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
 * "Phân loại" (a rich LOG-group selector, Cost Nature as two option cards)
 * and "Khoản chi
 * phí" (name, quantity, unit price, invoice number, provider, note) — a live
 * "after saving" preview and a fixed footer with the unsaved-changes hint.
 * A sibling fee drawer can fill the group, name and Cost Nature without
 * replacing this form. Closing with changes asks first. Saving resends the shipment's cost list
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

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFeePickerOpen, setIsFeePickerOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickError, setQuickError] = useState('');
  const templatesQuery = useShipmentCostItemTemplatesQuery();
  const createTemplate = useCreateShipmentCostItemTemplateMutation();
  const templates = templatesQuery.data?.success
    ? templatesQuery.data.costItemTemplates
    : [];
  const selectedCategory = costCategories.find(
    (category) => category.id === values.costCategoryId,
  );
  const pickedFee = matchingFee(templates, values.costCategoryId, values.name);

  function openQuickAdd() {
    setQuickName(
      matchingFee(templates, values.costCategoryId, values.name)
        ? ''
        : values.name.trim(),
    );
    setQuickError('');
    setIsQuickAddOpen(true);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function saveQuickFee(event) {
    event.preventDefault();
    const name = quickName.trim();
    if (!name || name.length > NAME_MAX) {
      setQuickError(`Nhập tên loại phí từ 1 đến ${NAME_MAX} ký tự.`);
      return;
    }
    if (
      templates.some(
        (fee) =>
          fee.costCategoryId === values.costCategoryId &&
          fee.name.trim().toLocaleLowerCase('vi') ===
            name.toLocaleLowerCase('vi'),
      )
    ) {
      setQuickError(
        'Loại phí này đã có trong nhóm. Hãy chọn từ danh sách khuyến nghị.',
      );
      return;
    }
    setQuickError('');
    const result = await createTemplate.mutateAsync({
      values: {
        name,
        costCategoryId: values.costCategoryId,
        defaultCostNature: values.costNature,
      },
    });
    if (!result.success) {
      setQuickError(result.message);
      return;
    }
    setField('name', result.costItemTemplate.name);
    setField('costNature', result.costItemTemplate.defaultCostNature);
    setIsQuickAddOpen(false);
    toast({ body: `Đã thêm loại phí “${result.costItemTemplate.name}”.` });
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
                      <ComplexSelector
                        label="Nhóm chi phí"
                        isRequired
                        value={values.costCategoryId}
                        onChange={(categoryId) =>
                          setField('costCategoryId', categoryId)
                        }
                        triggerLabel={
                          selectedCategory ? (
                            <HStack gap={2} vAlign="center" wrap="nowrap">
                              <MetaPill
                                label={selectedCategory.code}
                                tone="accent"
                                size="sm"
                              />
                              <Text maxLines={1}>{selectedCategory.name}</Text>
                            </HStack>
                          ) : undefined
                        }
                        placeholder="Chọn nhóm chi phí LOG-01 – LOG-08"
                        status={fieldStatuses.costCategoryId}
                        statusVariant="detached"
                        width="100%"
                        contentXstyle={styles.categoryPopup}
                      >
                        {(categoryId, onChange, close) => (
                          <VStack gap={3} hAlign="stretch">
                            <HStack hAlign="between" vAlign="center" gap={2}>
                              <Text weight="semibold">Chọn nhóm chi phí</Text>
                              <MetaPill
                                label={`${costCategories.length} nhóm LOG`}
                                tone="accent"
                                size="sm"
                              />
                            </HStack>
                            <RadioList
                              label="Nhóm chi phí"
                              isLabelHidden
                              value={categoryId}
                              onChange={(nextId) => {
                                onChange(nextId);
                                close();
                              }}
                            >
                              {costCategories.map((category) => (
                                <RadioListItem
                                  key={category.id}
                                  value={category.id}
                                  label={
                                    <HStack gap={2} vAlign="center" wrap="wrap">
                                      <MetaPill
                                        label={category.code}
                                        tone={
                                          category.id === categoryId
                                            ? 'accent'
                                            : 'neutral'
                                        }
                                        size="sm"
                                      />
                                      <Text weight="semibold">
                                        {category.name}
                                      </Text>
                                    </HStack>
                                  }
                                  description={groupMeaning(category.note)}
                                />
                              ))}
                            </RadioList>
                          </VStack>
                        )}
                      </ComplexSelector>
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
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <VStack hAlign="stretch" xstyle={styles.nameInput}>
                          <TextInput
                            label="Tên khoản chi phí"
                            isLabelHidden
                            value={values.name}
                            onChange={(value) =>
                              setField('name', value.slice(0, NAME_MAX))
                            }
                            placeholder="Nhập tên khoản chi phí"
                            status={fieldStatuses.name}
                            statusVariant="detached"
                            width="100%"
                          />
                        </VStack>
                        <Button
                          label="Loại phí khuyến nghị"
                          type="button"
                          variant="secondary"
                          icon={<Icon icon={Sparkles} size="sm" />}
                          onClick={() => setIsFeePickerOpen(true)}
                          xstyle={styles.recommendationButton}
                        />
                      </HStack>
                      {values.name.trim() && selectedCategory && !pickedFee ? (
                        <Button
                          label="Lưu loại phí mới vào danh mục"
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={<Icon icon={Plus} size="sm" />}
                          onClick={openQuickAdd}
                        />
                      ) : null}
                      {pickedFee?.note || pickedFee?.occurrencePoint ? (
                        <Text size="sm" color="secondary">
                          {[pickedFee.occurrencePoint, pickedFee.note]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      ) : null}
                    </VStack>

                    <Grid columns={TWO_COLUMNS} gap={3}>
                      <VStack gap={1} hAlign="stretch">
                        <FieldLabel label="Số lượng" isRequired />
                        <FormattedNumberTextInput
                          label="Số lượng"
                          isLabelHidden
                          value={values.quantity}
                          onChange={form.setQuantity}
                          status={fieldStatuses.quantity}
                          statusVariant="detached"
                        />
                      </VStack>
                      <VStack gap={1} hAlign="stretch">
                        <FieldLabel label="Đơn giá (VNĐ)" isRequired />
                        <FormattedNumberTextInput
                          label="Đơn giá (VNĐ)"
                          isLabelHidden
                          value={form.unitPrice}
                          onChange={form.setUnitPrice}
                          units="đ"
                          status={fieldStatuses.amount}
                          statusVariant="detached"
                        />
                      </VStack>
                    </Grid>
                    <HStack hAlign="between" vAlign="center" gap={2}>
                      <Text size="sm" color="secondary">
                        Thành tiền (số lượng × đơn giá)
                      </Text>
                      <Text weight="bold" color="accent" hasTabularNumbers>
                        {formatVndAmount(amount)}
                      </Text>
                    </HStack>

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

                    <RichTextNoteField
                      label="Ghi chú"
                      isOptional
                      value={values.note}
                      onChange={(value) => setField('note', value)}
                      placeholder="Ghi chú (không bắt buộc)"
                      maxLength={NOTE_MAX}
                      status={fieldStatuses.note}
                      statusVariant="tooltip"
                    />
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

      {isFeePickerOpen ? (
        <ShipmentRecommendedFeeDrawer
          costCategories={costCategories}
          initialCostCategoryId={values.costCategoryId}
          onClose={() => setIsFeePickerOpen(false)}
          onSelect={(fee) => {
            setField('costCategoryId', fee.costCategoryId);
            setField('name', fee.name.slice(0, NAME_MAX));
            setField('costNature', fee.defaultCostNature);
            setIsFeePickerOpen(false);
          }}
        />
      ) : null}

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

      <FormDialog
        isOpen={isQuickAddOpen}
        onOpenChange={(open) => {
          if (!open) setIsQuickAddOpen(false);
        }}
        title="Thêm nhanh loại phí"
        subtitle={
          selectedCategory
            ? `Nhóm ${selectedCategory.code} · ${selectedCategory.name}. Loại phí mới sẽ được chọn cho khoản chi phí này.`
            : ''
        }
        submitLabel="Thêm loại phí"
        draft={{ name: quickName }}
        isSubmitting={createTemplate.isPending}
        submitError={quickError}
        onSubmit={saveQuickFee}
        width={520}
      >
        <TextInput
          label="Tên loại phí"
          value={quickName}
          onChange={(name) => {
            setQuickName(name.slice(0, NAME_MAX));
            setQuickError('');
          }}
          placeholder="Ví dụ: Phí kiểm hóa"
          width="100%"
        />
        <Text size="sm" color="secondary">
          Cost Nature mặc định: {values.costNature}
        </Text>
      </FormDialog>
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
  nameInput: {
    flexBasis: 'calc(var(--spacing-10) * 7)',
    flexGrow: 1,
    minWidth: 0,
  },
  recommendationButton: {
    backgroundColor: 'var(--meta-blue-active-bg)',
    borderColor: 'var(--meta-blue-wash-border)',
    color: 'var(--color-accent)',
    flexShrink: 0,
  },
  categoryPopup: {
    maxHeight: 'min(70vh, calc(var(--spacing-10) * 14))',
    overflowY: 'auto',
    padding: 'var(--spacing-3)',
    width: 'min(calc(var(--spacing-10) * 13), calc(100vw - var(--spacing-8)))',
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
