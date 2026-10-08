'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Plus,
  Save,
  ScanLine,
  Ship,
  Split,
  Trash2,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { RichTextNoteField } from '@/shared/components/rich-text-note-field.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { currencyOptions } from '../config/currencies.js';
import { paymentTypeOptions } from '../config/payment-schedule-types.js';
import { withSavedOption } from '../config/place-options.js';
import {
  blankTransshipmentLeg,
  MAX_TRANSSHIPMENT_LEGS,
} from '../config/shipment-documents.js';
import {
  firstStepWithError,
  isSectionOpenByDefault,
  sectionCompleteness,
  sectionHasError,
  sectionsForStage,
  SHIPMENT_CREATE_STEPS,
  SHIPMENT_FORM_SECTIONS,
  stepFields,
  stepOfSection,
  stepState,
} from '../config/shipment-form-sections.js';
import {
  metaToneForCustomsChannel,
  shipmentCustomsChannelOptions,
  shipmentServiceTermOptions,
} from '../config/shipment-operational-details.js';
import {
  labelForShipmentQuantityUnit,
  quantityUnitForShipmentType,
} from '../config/shipment-quantity-units.js';
import {
  tracksDestinationFreeTime,
  tracksOriginFreeTime,
} from '../config/shipment-schedule.js';
import {
  labelForShipmentStatus,
  metaToneForShipmentStatus,
  requiresDeclarationFigures,
  shipmentStatusOptions,
} from '../config/shipment-status.js';
import {
  labelForShipmentType,
  shipmentTypeOptions,
} from '../config/shipment-types.js';
import { useShipmentForm } from '../hooks/use-shipment-form.js';
import { QuickCreatePortDialog } from './quick-create-port-dialog.jsx';
import { QuickCreateSupplierDialog } from './quick-create-supplier-dialog.jsx';
import { ShipmentFormOutline } from './shipment-form-outline.jsx';
import { ShipmentFormSection } from './shipment-form-section.jsx';
import { ShipmentFreeTimeFields } from './shipment-free-time-fields.jsx';
import { ShipmentGoodsAndPartiesFields } from './shipment-goods-and-parties-fields.jsx';

// Stitch "Chỉnh sửa Shipment" (project 6957224641630765183, screen
// cab96b6c…) drawer width, plus the section outline (`shipment-staged-form`).
const DRAWER_WIDTH = 1120;
const TWO_COLUMNS = { minWidth: 280, max: 2 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** @typedef {import('@astryxdesign/core/Calendar').ISODateString} ISODateString */
/** @typedef {import('../config/shipment-form-sections.js').ShipmentFormSection} ShipmentFormSection */
/** @typedef {ShipmentFormSection['id']} ShipmentFormSectionId */

/**
 * Meta drawer that creates a shipment under `contract`, or edits one
 * (`shipment`) — Stitch "Chỉnh sửa Shipment"
 * (`.stitch/prompts/meta-shipment-edit-drawer.md`). The only Shipment
 * editor (the fullscreen `ShipmentFormDialog` was removed); VGM and costs
 * are managed on the shipment page after creating. Data and rules come
 * from `useShipmentForm` (validation, create / update call, supplier list,
 * defaults such as the contract's ports; on edit the cost lines are resent
 * unchanged) — laid out as the boxed groups of `SHIPMENT_FORM_SECTIONS`
 * beside an outline of how complete each one is. Groups not yet relevant
 * to the status start collapsed ("Bổ sung"), so a new shipment asks for
 * booking-time data only; a group opens once its stage is reached, it has
 * data or an error, or the user opens it. Field errors sit under each
 * field (detached) and the body scrolls to the first one. Closing with
 * changes asks first. "Loại hình" is only editable when creating.
 *
 * Creating is a stepper instead (`shipment-create-stepper`): one step of
 * `SHIPMENT_CREATE_STEPS` at a time, any step reachable; "Tiếp" checks
 * only that step, "Tạo Shipment" (every step) checks everything and lands
 * on the first step with an error. The last step reviews every group.
 *
 * `stage` ("Chuyển sang …" on the shipment page) presets "Tình trạng" to
 * that status and shows only the groups of that stage (`sectionsForStage`)
 * until "Hiện tất cả mục" — or a validation error elsewhere — reveals the
 * rest.
 *
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   shipment?: import('../types/index.js').Shipment | null,
 *   stage?: import('../types/index.js').ShipmentStatus | null,
 *   onClose: () => void,
 *   onSaved?: (shipment: import('../types/index.js').Shipment) => void,
 * }} props
 */
export function ShipmentFormDrawer({
  contract,
  shipment = null,
  stage = null,
  onClose,
  onSaved,
}) {
  const isCreating = shipment === null;
  const isStaging = stage !== null && shipment !== null;
  // Creating walks through `SHIPMENT_CREATE_STEPS` (`shipment-create-stepper`).
  const [stepIndex, setStepIndex] = useState(0);
  const step = isCreating ? SHIPMENT_CREATE_STEPS[stepIndex] : null;
  const isLastStep = stepIndex === SHIPMENT_CREATE_STEPS.length - 1;
  const title = isCreating
    ? 'Thêm Shipment'
    : isStaging
      ? 'Cập nhật tình trạng'
      : 'Chỉnh sửa Shipment';
  const [isShowingAll, setIsShowingAll] = useState(!isStaging);
  const formId = useId();
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const toast = useAppToast();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreatePlace, setQuickCreatePlace] = useState(
    /** @type {'placeOfLoading' | 'placeOfDischarge' | null} */ (null),
  );
  const form = useShipmentForm({
    contractId: contract.id,
    contract,
    shipment,
    targetStatus: isStaging ? stage : null,
    onSuccess: (saved) => {
      toast({
        body: isCreating
          ? 'Đã tạo Shipment.'
          : isStaging
            ? `Đã chuyển sang “${labelForShipmentStatus(saved.status)}”.`
            : 'Đã cập nhật Shipment.',
      });
      onSaved?.(saved);
      onClose();
    },
  });
  const { values, setField, fieldStatuses } = form;
  // The hook starts from the shipment (edit) or its defaults (create).
  const [initialValues] = useState(values);
  const customers = /** @type {import('../types/index.js').Supplier[]} */ (
    form.customers
  );
  // A preset status is itself the change being saved.
  const isDirty =
    (isStaging && values.status !== shipment.status) ||
    JSON.stringify(values) !== JSON.stringify(initialValues);
  const isDisabled = form.isSubmitting;

  // Errors force a group open, then the user's choice, else the status /
  // data rule.
  const [openChoices, setOpenChoices] = useState(
    /** @type {Partial<Record<ShipmentFormSectionId, boolean>>} */ ({}),
  );
  const stageSections = isStaging ? sectionsForStage(stage) : [];
  const sectionStates = SHIPMENT_FORM_SECTIONS.map((section) => ({
    section,
    completeness: sectionCompleteness(section, values, fieldStatuses),
  }));
  const visibleSectionStates = sectionStates.filter(({ section }) =>
    step
      ? step.sections.includes(section.id)
      : isShowingAll ||
        stageSections.includes(section.id) ||
        sectionHasError(section, fieldStatuses),
  );
  /** @param {ShipmentFormSectionId} id @param {boolean} isOpen */
  const setSectionOpen = (id, isOpen) =>
    setOpenChoices((choices) => ({ ...choices, [id]: isOpen }));
  /** @param {ShipmentFormSectionId} id */
  const sectionProps = (id) => {
    const index = visibleSectionStates.findIndex(
      ({ section }) => section.id === id,
    );
    const { section, completeness } = visibleSectionStates[index] ?? {
      section: SHIPMENT_FORM_SECTIONS.find((item) => item.id === id),
      completeness: { state: 'optional', missing: 0 },
    };
    return {
      id: `${formId}-${id}`,
      section: /** @type {ShipmentFormSection} */ (section),
      // Numbers would restart on every step; the stepper numbers instead.
      index: step ? undefined : index + 1,
      isHidden: index === -1,
      // A step shows its groups in full.
      isCollapsible: !step,
      // A stage's own groups start open; it is what the user came to fill.
      isOpen:
        Boolean(step) ||
        sectionHasError(section, fieldStatuses) ||
        (openChoices[id] ??
          (stageSections.includes(id) ||
            isSectionOpenByDefault(section, values))),
      /** @param {boolean} isOpen */
      onOpenChange: (isOpen) => setSectionOpen(id, isOpen),
      completeness,
    };
  };
  /** @param {ShipmentFormSectionId} id */
  function goToSection(id) {
    setSectionOpen(id, true);
    requestAnimationFrame(() => {
      document
        .getElementById(`${formId}-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const supplierOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.companyName,
  }));
  const quantityUnit = quantityUnitForShipmentType(values.type);
  // Declaration figures: optional while Booked / Packing.
  const figuresRequired = requiresDeclarationFigures(values.status);
  const transitDays =
    values.etd && values.eta
      ? Math.round((Date.parse(values.eta) - Date.parse(values.etd)) / DAY_MS)
      : null;

  function requestClose() {
    if (isDirty) setIsConfirmingDiscard(true);
    else onClose();
  }

  // Bring the first invalid field into view (long form).
  function scrollToFirstError() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /** @param {number} index */
  function goToStep(index) {
    setStepIndex(index);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'start' });
    });
  }

  // "Tiếp": only this step's fields must be valid to move on.
  function goToNextStep() {
    if (!step) return;
    const errors = form.validate(stepFields(step));
    if (stepState(step, values, errors) === 'error') scrollToFirstError();
    else goToStep(stepIndex + 1);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    if (step) {
      // Saving from any step: land on the first step holding an error.
      const errorStep = firstStepWithError(form.validate());
      if (errorStep !== -1) {
        event.preventDefault();
        setStepIndex(errorStep);
        scrollToFirstError();
        return;
      }
    }
    await form.handleSubmit(event);
    scrollToFirstError();
  }

  /**
   * Shared props of a field with a detached error line.
   * @param {string} key
   */
  const statusOf = (key) => ({
    status: fieldStatuses[key],
    statusVariant: /** @type {const} */ ('detached'),
  });

  const hasOriginFreeTime = tracksOriginFreeTime(contract.incoterm);
  const hasDestinationFreeTime = tracksDestinationFreeTime(contract.incoterm);
  /** @param {number} index @param {string} port */
  const setTransshipmentPort = (index, port) =>
    setField(
      'transshipmentLegs',
      values.transshipmentLegs.map((leg, legIndex) =>
        legIndex === index ? { ...leg, port } : leg,
      ),
    );
  /** @param {'originFreeTime' | 'destinationFreeTime'} side */
  const freeTimeStatuses = (side) => ({
    demDays: fieldStatuses[`${side}.demDays`],
    detDays: fieldStatuses[`${side}.detDays`],
    combinedDays: fieldStatuses[`${side}.combinedDays`],
  });

  /** @param {keyof typeof values} key */
  const dateValue = (key) =>
    /** @type {ISODateString | undefined} */ (values[key] || undefined);

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
        label={title}
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <VStack gap={4} hAlign="stretch">
                <MetaDrawerHeader
                  icon={Ship}
                  title={title}
                  meta={
                    shipment ? (
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Text
                          size="sm"
                          weight="bold"
                          color="accent"
                          type="code"
                        >
                          {shipment.shipmentCode}
                        </Text>
                        <Text size="sm" color="secondary" aria-hidden>
                          •
                        </Text>
                        <MetaPill
                          label={labelForShipmentType(shipment.type)}
                          tone="accent"
                        />
                        <MetaPill
                          label={labelForShipmentStatus(shipment.status)}
                          tone={metaToneForShipmentStatus(shipment.status)}
                          hasBorder
                        />
                      </HStack>
                    ) : (
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Text size="sm" color="secondary">
                          Hợp đồng
                        </Text>
                        <Text
                          size="sm"
                          weight="bold"
                          color="accent"
                          type="code"
                        >
                          {contract.contractNumber}
                        </Text>
                        <Text size="sm" color="secondary" aria-hidden>
                          •
                        </Text>
                        <MetaPill
                          label={`${contract.incoterm} ${contract.incotermYear}`}
                          tone="neutral"
                        />
                        <Text size="sm" color="secondary" maxLines={1}>
                          {contract.projectName}
                        </Text>
                      </HStack>
                    )
                  }
                  onClose={requestClose}
                />
                {step ? (
                  <Stepper
                    label="Các bước thêm Shipment"
                    density="compact"
                    activeStep={stepIndex}
                    onStepClick={goToStep}
                    horizontalOptions={{
                      minimumStepWidth: 112,
                      collapsedVariant: 'withLabel',
                    }}
                    xstyle={styles.stepper}
                  >
                    {SHIPMENT_CREATE_STEPS.map((item, index) => {
                      const state = stepState(item, values, fieldStatuses);
                      return (
                        <Step
                          key={item.label}
                          step={index}
                          label={item.label}
                          description={item.stageLabel}
                          status={
                            state === 'error'
                              ? 'error'
                              : state === 'complete'
                                ? 'success'
                                : undefined
                          }
                          // A check only when the step is really complete,
                          // not merely passed.
                          indicator={
                            state === 'error' ? (
                              <Icon
                                icon={CircleAlert}
                                size="sm"
                                color="inherit"
                              />
                            ) : state === 'complete' ? (
                              <Icon
                                icon={CircleCheck}
                                size="sm"
                                color="inherit"
                              />
                            ) : (
                              'number'
                            )
                          }
                        />
                      );
                    })}
                  </Stepper>
                ) : null}
              </VStack>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              <form
                ref={formRef}
                id={formId}
                onSubmit={handleSubmit}
                noValidate
                {...stylex.props(styles.fields)}
              >
                <HStack gap={5} vAlign="start" wrap="nowrap">
                  {step ? null : (
                    <VStack hAlign="stretch" xstyle={styles.outline}>
                      <ShipmentFormOutline
                        sections={visibleSectionStates}
                        onSelect={goToSection}
                      />
                    </VStack>
                  )}
                  <StackItem size="fill" xstyle={styles.body}>
                    <VStack gap={4} hAlign="stretch">
                      {isStaging ? (
                        <Banner
                          status="info"
                          container="card"
                          title={`Chuyển tình trạng: ${labelForShipmentStatus(shipment.status)} → ${labelForShipmentStatus(stage)}`}
                          description={
                            figuresRequired
                              ? 'Từ giai đoạn này số liệu tờ khai (giá trị, tỷ giá, số lượng, khối lượng) là bắt buộc; các thông tin khác bổ sung nếu đã có, rồi lưu.'
                              : stageSections.length > 1
                                ? 'Bổ sung thông tin của giai đoạn này nếu đã có (không bắt buộc), rồi lưu.'
                                : 'Thêm ghi chú nếu cần, rồi lưu.'
                          }
                          endContent={
                            isShowingAll ? null : (
                              <Button
                                label="Hiện tất cả mục"
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => setIsShowingAll(true)}
                              />
                            )
                          }
                        />
                      ) : null}
                      {form.submitError ? (
                        <Banner
                          status="error"
                          title={form.submitError}
                          container="card"
                        />
                      ) : null}

                      <ShipmentFormSection {...sectionProps('basic')}>
                        <HStack gap={4} vAlign="start" wrap="nowrap">
                          <StackItem size="fill">
                            <TextInput
                              label="Tên lô hàng"
                              value={values.name}
                              onChange={(value) => setField('name', value)}
                              isRequired
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('name')}
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
                              width={160}
                              isDisabled={!isCreating || isDisabled}
                              disabledMessage={
                                isCreating
                                  ? undefined
                                  : 'Không đổi được sau khi tạo Shipment'
                              }
                              isRequired
                              {...statusOf('type')}
                            />
                          </StackItem>
                        </HStack>

                        <Grid columns={TWO_COLUMNS} gap={4}>
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
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('paymentCondition')}
                          />
                          <TextInput
                            label="Số L/C"
                            placeholder="Khi thanh toán bằng L/C"
                            value={values.letterOfCreditNumber}
                            onChange={(value) =>
                              setField('letterOfCreditNumber', value)
                            }
                            isOptional
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('letterOfCreditNumber')}
                          />
                          <Selector
                            label="Tình trạng"
                            placeholder="Chọn tình trạng"
                            value={values.status}
                            onChange={(value) =>
                              setField(
                                'status',
                                /** @type {import('../types/index.js').ShipmentStatus | ''} */ (
                                  value ?? ''
                                ),
                              )
                            }
                            options={shipmentStatusOptions}
                            renderOption={(option) => (
                              <MetaPill
                                label={option.label ?? String(option.value)}
                                tone={metaToneForShipmentStatus(option.value)}
                                hasBorder
                              />
                            )}
                            renderValue={(option) => (
                              <MetaPill
                                label={option.label ?? String(option.value)}
                                tone={metaToneForShipmentStatus(option.value)}
                                hasBorder
                              />
                            )}
                            isRequired
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('status')}
                          />
                          <MoneyWithCurrency
                            label="Giá trị invoice"
                            amount={values.invoiceValue}
                            onAmountChange={(value) =>
                              setField('invoiceValue', value)
                            }
                            currency={values.invoiceCurrency}
                            onCurrencyChange={(value) =>
                              setField('invoiceCurrency', value)
                            }
                            amountStatus={fieldStatuses.invoiceValue}
                            currencyStatus={fieldStatuses.invoiceCurrency}
                            isDisabled={isDisabled}
                          />
                        </Grid>

                        <Grid columns={TWO_COLUMNS} gap={4}>
                          {/* All three default from the contract
                          (`useShipmentForm`) and stay editable per
                          shipment; tracking shows these, not the
                          contract's. POL / POD pick from the same port
                          catalogs as the contract form. */}
                          <HStack gap={2} vAlign="start" wrap="nowrap">
                            <StackItem size="fill">
                              <Selector
                                label="Cảng/nơi xếp hàng (POL)"
                                hasSearch
                                placeholder="Chọn nơi xếp hàng"
                                value={values.placeOfLoading || null}
                                onChange={(value) =>
                                  setField('placeOfLoading', value ?? '')
                                }
                                options={withSavedOption(
                                  form.loadingPlaces.map((place) => ({
                                    value: place.name,
                                    label: place.label,
                                  })),
                                  values.placeOfLoading,
                                )}
                                hasClear
                                isOptional
                                isDisabled={isDisabled}
                                width="100%"
                                {...statusOf('placeOfLoading')}
                              />
                            </StackItem>
                            <VStack xstyle={styles.alignWithField}>
                              <IconButton
                                label="Thêm nơi xếp hàng"
                                tooltip="Thêm nơi xếp hàng"
                                icon={<Icon icon={Plus} size="sm" />}
                                type="button"
                                variant="secondary"
                                isDisabled={
                                  isDisabled || !form.vietnamCountryId
                                }
                                onClick={() =>
                                  setQuickCreatePlace('placeOfLoading')
                                }
                              />
                            </VStack>
                          </HStack>
                          <HStack gap={2} vAlign="start" wrap="nowrap">
                            <StackItem size="fill">
                              <Selector
                                label="Cảng đến (POD)"
                                hasSearch
                                placeholder="Chọn cảng đến"
                                value={values.placeOfDischarge || null}
                                onChange={(value) =>
                                  setField('placeOfDischarge', value ?? '')
                                }
                                options={withSavedOption(
                                  form.dischargePlaces.map((place) => ({
                                    value: place.name,
                                    label: place.label,
                                  })),
                                  values.placeOfDischarge,
                                )}
                                hasClear
                                isOptional
                                isDisabled={isDisabled}
                                width="100%"
                                {...statusOf('placeOfDischarge')}
                              />
                            </StackItem>
                            <VStack xstyle={styles.alignWithField}>
                              <IconButton
                                label="Thêm cảng đến"
                                tooltip="Thêm cảng đến"
                                icon={<Icon icon={Plus} size="sm" />}
                                type="button"
                                variant="secondary"
                                isDisabled={
                                  isDisabled || !form.dischargeCountryId
                                }
                                onClick={() =>
                                  setQuickCreatePlace('placeOfDischarge')
                                }
                              />
                            </VStack>
                          </HStack>
                          <VStack hAlign="stretch" xstyle={styles.fullRow}>
                            <TextArea
                              label="Nơi giao hàng (Place of Delivery)"
                              description="Mặc định theo hợp đồng"
                              placeholder="VD: Công trình ABC, địa chỉ…"
                              rows={3}
                              value={values.placeOfDelivery}
                              onChange={(value) =>
                                setField('placeOfDelivery', value)
                              }
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('placeOfDelivery')}
                            />
                          </VStack>
                        </Grid>
                      </ShipmentFormSection>

                      <ShipmentFormSection {...sectionProps('parties')}>
                        <VStack gap={4} hAlign="stretch">
                          <HStack gap={2} vAlign="start" wrap="nowrap">
                            <StackItem size="fill">
                              <Selector
                                label="Forwarder"
                                hasSearch
                                placeholder="Chọn forwarder"
                                value={values.supplierCustomerId}
                                onChange={(value) =>
                                  setField('supplierCustomerId', value ?? '')
                                }
                                options={supplierOptions}
                                isRequired
                                isDisabled={isDisabled}
                                width="100%"
                                {...statusOf('supplierCustomerId')}
                              />
                            </StackItem>
                            <VStack xstyle={styles.alignWithField}>
                              <IconButton
                                label="Thêm nhà cung cấp"
                                tooltip="Thêm nhà cung cấp"
                                icon={<Icon icon={Plus} size="sm" />}
                                type="button"
                                variant="secondary"
                                isDisabled={isDisabled}
                                onClick={() => setIsQuickCreateOpen(true)}
                              />
                            </VStack>
                          </HStack>

                          {/* Several suppliers per task allowed (BE-kt-xnk
                        `add-shipment-service-providers`). */}
                          <Grid columns={TWO_COLUMNS} gap={4}>
                            <MultiSelector
                              label="Đại lý hải quan"
                              hasSearch
                              triggerDisplay="badges"
                              placeholder="Chọn một hoặc nhiều nhà cung cấp"
                              value={values.customsBrokerIds}
                              onChange={(value) =>
                                setField('customsBrokerIds', value)
                              }
                              options={supplierOptions}
                              isOptional
                              isDisabled={isDisabled}
                            />
                            <MultiSelector
                              label="Đơn vị trucking"
                              hasSearch
                              triggerDisplay="badges"
                              placeholder="Chọn một hoặc nhiều nhà cung cấp"
                              value={values.truckingIds}
                              onChange={(value) =>
                                setField('truckingIds', value)
                              }
                              options={supplierOptions}
                              isOptional
                              isDisabled={isDisabled}
                            />
                          </Grid>
                        </VStack>
                      </ShipmentFormSection>

                      <ShipmentFormSection {...sectionProps('booking')}>
                        <VStack gap={4} hAlign="stretch">
                          <Grid columns={TWO_COLUMNS} gap={4}>
                            <TextInput
                              label="Số booking"
                              value={values.bookingNumber}
                              onChange={(value) =>
                                setField('bookingNumber', value)
                              }
                              isRequired
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('bookingNumber')}
                            />
                            <TextInput
                              label="Số B/L"
                              value={values.billOfLadingNumber}
                              onChange={(value) =>
                                setField('billOfLadingNumber', value)
                              }
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('billOfLadingNumber')}
                            />
                            <TextInput
                              label="Line tàu"
                              placeholder="Ví dụ: KMTC, SITC"
                              value={values.shippingLine}
                              onChange={(value) =>
                                setField('shippingLine', value)
                              }
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('shippingLine')}
                            />
                            <TextInput
                              label="Tên tàu"
                              placeholder="Ví dụ: KMTC JAKARTA // 2604S"
                              value={values.vesselName}
                              onChange={(value) =>
                                setField('vesselName', value)
                              }
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('vesselName')}
                            />
                            <TextInput
                              label="Số chuyến"
                              placeholder="Ví dụ: 2604S"
                              value={values.voyageNumber}
                              onChange={(value) =>
                                setField('voyageNumber', value)
                              }
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                              {...statusOf('voyageNumber')}
                            />
                            <Selector
                              label="Điều kiện giao nhận"
                              placeholder="CY/CY, CFS/CFS…"
                              value={values.serviceTerm || null}
                              onChange={(value) =>
                                setField('serviceTerm', value ?? '')
                              }
                              options={shipmentServiceTermOptions}
                              hasClear
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                            />
                            <VStack
                              gap={2}
                              hAlign="stretch"
                              xstyle={styles.fullRow}
                            >
                              <Text size="sm" weight="semibold">
                                Phương thức vận chuyển
                              </Text>
                              <SegmentedControl
                                label="Phương thức vận chuyển"
                                layout="fill"
                                value={
                                  values.isTransshipment
                                    ? 'transshipment'
                                    : 'direct'
                                }
                                onChange={(value) => {
                                  if (
                                    value === 'transshipment' &&
                                    values.transshipmentLegs.length === 0
                                  ) {
                                    setField('transshipmentLegs', [
                                      blankTransshipmentLeg(),
                                    ]);
                                  }
                                  setField(
                                    'isTransshipment',
                                    value === 'transshipment',
                                  );
                                }}
                                isDisabled={isDisabled}
                              >
                                <SegmentedControlItem
                                  value="direct"
                                  label="Đi thẳng"
                                  icon={<Icon icon={ArrowRight} size="sm" />}
                                />
                                <SegmentedControlItem
                                  value="transshipment"
                                  label="Chuyển tải"
                                  icon={<Icon icon={Split} size="sm" />}
                                />
                              </SegmentedControl>
                            </VStack>
                            {values.isTransshipment ? (
                              <VStack
                                gap={3}
                                hAlign="stretch"
                                xstyle={styles.fullRow}
                              >
                                <HStack
                                  hAlign="between"
                                  vAlign="center"
                                  gap={2}
                                  wrap="wrap"
                                >
                                  <Text size="sm" weight="semibold">
                                    Cảng chuyển tải theo thứ tự tuyến
                                  </Text>
                                  <Button
                                    label="Thêm cảng chuyển tải"
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<Icon icon={Plus} size="sm" />}
                                    isDisabled={
                                      isDisabled ||
                                      values.transshipmentLegs.length >=
                                        MAX_TRANSSHIPMENT_LEGS
                                    }
                                    onClick={() =>
                                      setField('transshipmentLegs', [
                                        ...values.transshipmentLegs,
                                        blankTransshipmentLeg(),
                                      ])
                                    }
                                  />
                                </HStack>
                                {values.transshipmentLegs.map((leg, index) => (
                                  <HStack
                                    key={index}
                                    gap={2}
                                    vAlign="start"
                                    wrap="nowrap"
                                  >
                                    <StackItem size="fill">
                                      <TextInput
                                        label={`Cảng chuyển tải ${index + 1}`}
                                        placeholder="Ví dụ: Singapore"
                                        value={leg.port}
                                        onChange={(port) =>
                                          setTransshipmentPort(index, port)
                                        }
                                        isRequired
                                        isDisabled={isDisabled}
                                        width="100%"
                                        {...statusOf(
                                          `transshipmentLegs.${index}.port`,
                                        )}
                                      />
                                    </StackItem>
                                    <VStack xstyle={styles.alignWithField}>
                                      <IconButton
                                        label={`Xoá cảng chuyển tải ${index + 1}`}
                                        tooltip="Xoá cảng chuyển tải"
                                        icon={<Icon icon={Trash2} size="sm" />}
                                        type="button"
                                        variant="ghost"
                                        isDisabled={
                                          isDisabled ||
                                          values.transshipmentLegs.length === 1
                                        }
                                        onClick={() =>
                                          setField(
                                            'transshipmentLegs',
                                            values.transshipmentLegs.filter(
                                              (_, legIndex) =>
                                                legIndex !== index,
                                            ),
                                          )
                                        }
                                      />
                                    </VStack>
                                  </HStack>
                                ))}
                              </VStack>
                            ) : null}
                          </Grid>
                        </VStack>
                      </ShipmentFormSection>

                      <ShipmentFormSection {...sectionProps('schedule')}>
                        <VStack gap={4} hAlign="stretch">
                          <Grid columns={TWO_COLUMNS} gap={4}>
                            <HStack gap={2} vAlign="start" wrap="nowrap">
                              <StackItem size="fill">
                                <DateInput
                                  label="Cut-off SI / VGM"
                                  value={dateValue('siCutoffDate')}
                                  onChange={(value) =>
                                    setField('siCutoffDate', value ?? '')
                                  }
                                  format={formatDateInputValue}
                                  isOptional
                                  isDisabled={isDisabled}
                                  {...statusOf('siCutoffDate')}
                                />
                              </StackItem>
                              <VStack xstyle={styles.alignWithField}>
                                <TimeInput
                                  label="Giờ nộp SI / VGM"
                                  isLabelHidden
                                  value={
                                    /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
                                      values.siCutoffTime || undefined
                                    )
                                  }
                                  onChange={(value) =>
                                    setField('siCutoffTime', value ?? '')
                                  }
                                  hourFormat="24h"
                                  width={132}
                                  isDisabled={isDisabled}
                                />
                              </VStack>
                            </HStack>
                            <HStack gap={2} vAlign="start" wrap="nowrap">
                              <StackItem size="fill">
                                <DateInput
                                  label="Cut-off CY"
                                  value={dateValue('cyCutoffDate')}
                                  onChange={(value) =>
                                    setField('cyCutoffDate', value ?? '')
                                  }
                                  format={formatDateInputValue}
                                  isOptional
                                  isDisabled={isDisabled}
                                  {...statusOf('cyCutoffDate')}
                                />
                              </StackItem>
                              <VStack xstyle={styles.alignWithField}>
                                <TimeInput
                                  label="Giờ cut-off hạ bãi"
                                  isLabelHidden
                                  value={
                                    /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
                                      values.cyCutoffTime || undefined
                                    )
                                  }
                                  onChange={(value) =>
                                    setField('cyCutoffTime', value ?? '')
                                  }
                                  hourFormat="24h"
                                  width={132}
                                  isDisabled={isDisabled}
                                />
                              </VStack>
                            </HStack>
                            <DateInput
                              label="ETD (Ngày xuất hành)"
                              value={dateValue('etd')}
                              onChange={(value) => setField('etd', value ?? '')}
                              format={formatDateInputValue}
                              isOptional
                              isDisabled={isDisabled}
                              {...statusOf('etd')}
                            />
                            <DateInput
                              label="ETA (Ngày dự kiến đến)"
                              value={dateValue('eta')}
                              onChange={(value) => setField('eta', value ?? '')}
                              format={formatDateInputValue}
                              isOptional
                              isDisabled={isDisabled}
                              {...statusOf('eta')}
                            />
                          </Grid>
                          <Text size="sm" color="meta-subtle">
                            {transitDays !== null && transitDays >= 0
                              ? `Transit: ${transitDays} ngày. `
                              : ''}
                            Đổi ETD / ETA / cut-off / tàu đã có được lưu vào
                            lịch sử lịch tàu; khi hãng tàu báo trễ, dùng “Cập
                            nhật lịch tàu” trên trang lô hàng.
                          </Text>

                          {hasOriginFreeTime || hasDestinationFreeTime ? (
                            <Grid columns={TWO_COLUMNS} gap={4}>
                              {hasOriginFreeTime ? (
                                <ShipmentFreeTimeFields
                                  label="Free time đầu xuất"
                                  description="DET: lấy rỗng → hạ bãi · DEM: hạ bãi → xếp tàu"
                                  value={values.originFreeTime}
                                  onChange={(value) =>
                                    setField('originFreeTime', value)
                                  }
                                  statuses={freeTimeStatuses('originFreeTime')}
                                  isDisabled={isDisabled}
                                />
                              ) : null}
                              {hasDestinationFreeTime ? (
                                <ShipmentFreeTimeFields
                                  label="Free time đầu đích"
                                  description="DEM: dỡ hàng → lấy hàng ra · DET: lấy hàng ra → trả rỗng"
                                  value={values.destinationFreeTime}
                                  onChange={(value) =>
                                    setField('destinationFreeTime', value)
                                  }
                                  statuses={freeTimeStatuses(
                                    'destinationFreeTime',
                                  )}
                                  isDisabled={isDisabled}
                                />
                              ) : null}
                            </Grid>
                          ) : null}
                          {values.type === 'FCL' &&
                          hasDestinationFreeTime &&
                          !values.destinationFreeTime.mode ? (
                            <Grid columns={TWO_COLUMNS} gap={4}>
                              <DateInput
                                label="Hạn trả cont rỗng (nhập tay)"
                                description="Dùng khi chưa có free time đầu đích"
                                value={dateValue('emptyReturnDeadline')}
                                onChange={(value) =>
                                  setField('emptyReturnDeadline', value ?? '')
                                }
                                format={formatDateInputValue}
                                isOptional
                                isDisabled={isDisabled}
                                {...statusOf('emptyReturnDeadline')}
                              />
                            </Grid>
                          ) : null}
                        </VStack>
                      </ShipmentFormSection>

                      <ShipmentFormSection {...sectionProps('goods')}>
                        <ShipmentGoodsAndPartiesFields
                          contract={contract}
                          goodsLines={values.goodsLines}
                          onGoodsLineChange={(lineId, quantity) =>
                            setField('goodsLines', {
                              ...values.goodsLines,
                              [lineId]: quantity,
                            })
                          }
                          consigneeOverride={values.consigneeOverride}
                          notifyPartyOverride={values.notifyPartyOverride}
                          onPartyOverrideChange={(role, value) =>
                            setField(role, value)
                          }
                          isDisabled={isDisabled}
                        />
                      </ShipmentFormSection>

                      <ShipmentFormSection {...sectionProps('customs')}>
                        <Text size="sm" color="secondary">
                          {figuresRequired
                            ? 'Lô đã tới “Hạ bãi chờ xuất”: số liệu tờ khai là bắt buộc.'
                            : 'Số liệu tờ khai có thể bổ sung sau — bắt buộc từ “Hạ bãi chờ xuất”.'}
                        </Text>
                        <Grid columns={TWO_COLUMNS} gap={4}>
                          <MoneyWithCurrency
                            label="Giá trị tờ khai"
                            amount={values.declarationValue}
                            onAmountChange={(value) =>
                              setField('declarationValue', value)
                            }
                            currency={values.declarationCurrency}
                            onCurrencyChange={(value) =>
                              setField('declarationCurrency', value)
                            }
                            amountStatus={fieldStatuses.declarationValue}
                            currencyStatus={fieldStatuses.declarationCurrency}
                            isAmountRequired={figuresRequired}
                            isDisabled={isDisabled}
                          />
                          <FormattedNumberTextInput
                            label="Tỷ giá tờ khai"
                            value={values.declarationExchangeRate}
                            onChange={(value) =>
                              setField('declarationExchangeRate', value)
                            }
                            units="đ"
                            isRequired={figuresRequired}
                            isDisabled={isDisabled}
                            {...statusOf('declarationExchangeRate')}
                          />
                          <FormattedNumberTextInput
                            label="Số lượng"
                            value={values.quantityAmount}
                            onChange={(value) =>
                              setField('quantityAmount', value)
                            }
                            units={
                              quantityUnit
                                ? labelForShipmentQuantityUnit(quantityUnit)
                                : undefined
                            }
                            isRequired={figuresRequired}
                            isDisabled={isDisabled}
                            {...statusOf('quantityAmount')}
                          />
                          <FormattedNumberTextInput
                            label="Khối lượng tờ khai"
                            value={values.declarationWeightKg}
                            onChange={(value) =>
                              setField('declarationWeightKg', value)
                            }
                            units="kg"
                            isRequired={figuresRequired}
                            isDisabled={isDisabled}
                            {...statusOf('declarationWeightKg')}
                          />
                        </Grid>
                        <Grid columns={TWO_COLUMNS} gap={4}>
                          <TextInput
                            label="Mã C/O"
                            placeholder="Do hải quan cấp, tự nhập"
                            value={values.coNumber}
                            onChange={(value) => setField('coNumber', value)}
                            isOptional
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('coNumber')}
                          />
                          <TextInput
                            label="Form C/O"
                            placeholder="Ví dụ: Form D, Form E"
                            value={values.coForm}
                            onChange={(value) => setField('coForm', value)}
                            isOptional
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('coForm')}
                          />
                          <DateInput
                            label="Ngày khai C/O"
                            value={dateValue('coDeclarationDate')}
                            onChange={(value) =>
                              setField('coDeclarationDate', value ?? '')
                            }
                            format={formatDateInputValue}
                            isOptional
                            isDisabled={isDisabled}
                            {...statusOf('coDeclarationDate')}
                          />
                          <DateInput
                            label="Ngày có C/O"
                            value={dateValue('coIssuedDate')}
                            onChange={(value) =>
                              setField('coIssuedDate', value ?? '')
                            }
                            format={formatDateInputValue}
                            isOptional
                            isDisabled={isDisabled}
                            {...statusOf('coIssuedDate')}
                          />
                          <TextInput
                            label="Số tờ khai"
                            placeholder="Do hải quan cấp, tự nhập"
                            value={values.customsDeclarationNumber}
                            onChange={(value) =>
                              setField('customsDeclarationNumber', value)
                            }
                            isOptional
                            isDisabled={isDisabled}
                            width="100%"
                            {...statusOf('customsDeclarationNumber')}
                          />

                          <DateInput
                            label="Ngày khai"
                            value={dateValue('customsDeclarationDate')}
                            onChange={(value) =>
                              setField('customsDeclarationDate', value ?? '')
                            }
                            format={formatDateInputValue}
                            isOptional
                            isDisabled={isDisabled}
                            {...statusOf('customsDeclarationDate')}
                          />

                          {/* Own full row, like the "Bị kiểm hoá" tile below. */}
                          <VStack hAlign="stretch" xstyle={styles.fullRow}>
                            <Selector
                              label="Luồng tờ khai"
                              placeholder="Xanh / Vàng / Đỏ"
                              value={values.customsChannel || null}
                              onChange={(value) =>
                                setField(
                                  'customsChannel',
                                  /** @type {import('../types/index.js').ShipmentCustomsChannel | ''} */ (
                                    value ?? ''
                                  ),
                                )
                              }
                              options={shipmentCustomsChannelOptions}
                              renderOption={(option) => (
                                <MetaPill
                                  label={option.label ?? String(option.value)}
                                  tone={metaToneForCustomsChannel(
                                    /** @type {import('../types/index.js').ShipmentCustomsChannel} */ (
                                      option.value
                                    ),
                                  )}
                                  hasDot
                                />
                              )}
                              renderValue={(option) => (
                                <MetaPill
                                  label={option.label ?? String(option.value)}
                                  tone={metaToneForCustomsChannel(
                                    /** @type {import('../types/index.js').ShipmentCustomsChannel} */ (
                                      option.value
                                    ),
                                  )}
                                  hasDot
                                />
                              )}
                              hasClear
                              isOptional
                              isDisabled={isDisabled}
                              width="100%"
                            />
                          </VStack>
                          {/* Full-row option tile: scan icon + checkbox with a
                          hint; turns amber (same tone as the "Bị kiểm hoá"
                          pill on the overview) once ticked. */}
                          <HStack
                            gap={3}
                            vAlign="center"
                            xstyle={[
                              styles.checkTile,
                              values.customsInspected && styles.checkTileOn,
                            ]}
                          >
                            <HStack
                              hAlign="center"
                              vAlign="center"
                              xstyle={[
                                styles.checkIcon,
                                values.customsInspected && styles.checkIconOn,
                              ]}
                            >
                              <Icon icon={ScanLine} size="sm" color="inherit" />
                            </HStack>
                            <StackItem size="fill">
                              <CheckboxInput
                                label="Bị kiểm hoá hải quan"
                                description="Lô hàng bị hải quan kiểm tra thực tế (luồng đỏ)"
                                value={values.customsInspected}
                                onChange={(checked) =>
                                  setField('customsInspected', checked)
                                }
                                isDisabled={isDisabled}
                              />
                            </StackItem>
                          </HStack>
                        </Grid>
                      </ShipmentFormSection>

                      {step && isLastStep ? (
                        <MetaFormSection
                          isBoxed
                          isTitleUppercase={false}
                          title="Xem lại trước khi tạo"
                          action={
                            <MetaPill
                              label={labelForShipmentStatus(values.status)}
                              tone={metaToneForShipmentStatus(values.status)}
                              hasBorder
                            />
                          }
                        >
                          <Text size="sm" color="secondary">
                            Shipment sẽ được tạo với tình trạng trên. Nhóm còn
                            thiếu có thể bổ sung sau bằng “Chỉnh sửa” — chọn một
                            nhóm để quay lại bước của nó.
                          </Text>
                          <ShipmentFormOutline
                            sections={sectionStates.filter(
                              ({ section }) => section.id !== 'note',
                            )}
                            onSelect={(id) => goToStep(stepOfSection(id))}
                          />
                        </MetaFormSection>
                      ) : null}

                      <ShipmentFormSection {...sectionProps('note')}>
                        <RichTextNoteField
                          label="Ghi chú lô hàng"
                          isLabelHidden
                          value={values.note}
                          onChange={(value) => setField('note', value)}
                          placeholder="VD: yêu cầu đóng hàng, lưu ý giao nhận, liên hệ tại cảng…"
                          maxLength={2000}
                          isReadOnly={isDisabled}
                          {...statusOf('note')}
                        />
                      </ShipmentFormSection>
                    </VStack>
                  </StackItem>
                </HStack>
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
                  {isDirty ? <HStack as="span" xstyle={styles.dot} /> : null}
                  <Text size="sm" color="secondary">
                    {isDirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}
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
                  {step && stepIndex > 0 ? (
                    <Button
                      label="Quay lại"
                      variant="secondary"
                      size="lg"
                      icon={<Icon icon={ArrowLeft} size="sm" />}
                      isDisabled={form.isSubmitting}
                      onClick={() => goToStep(stepIndex - 1)}
                    />
                  ) : null}
                  {step && !isLastStep ? (
                    <Button
                      label="Tiếp"
                      variant="primary"
                      size="lg"
                      endContent={<Icon icon={ArrowRight} size="sm" />}
                      isDisabled={form.isSubmitting}
                      onClick={goToNextStep}
                    />
                  ) : null}
                  <Button
                    label={
                      isCreating
                        ? 'Tạo Shipment'
                        : isStaging
                          ? 'Lưu & chuyển tình trạng'
                          : 'Lưu thay đổi'
                    }
                    type="submit"
                    form={formId}
                    // Before the last step "Tiếp" is the main action; saving
                    // early stays one click away.
                    variant={step && !isLastStep ? 'secondary' : 'primary'}
                    size="lg"
                    icon={<Icon icon={isCreating ? Plus : Save} size="sm" />}
                    isLoading={form.isSubmitting}
                  />
                </HStack>
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>

      <QuickCreateSupplierDialog
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreated={(supplier) => setField('supplierCustomerId', supplier.id)}
      />
      <QuickCreatePortDialog
        isOpen={quickCreatePlace !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setQuickCreatePlace(null);
        }}
        countries={form.countries}
        countryId={
          quickCreatePlace === 'placeOfLoading'
            ? form.vietnamCountryId
            : form.dischargeCountryId
        }
        onCreated={(port) => {
          if (quickCreatePlace) {
            setField(quickCreatePlace, port.fullName || port.name);
          }
        }}
      />

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
 * Amount + currency pair ("Giá trị invoice" / "Giá trị tờ khai"): the
 * formatted amount with the currency as its suffix, and a narrow currency
 * select beside it.
 * @param {{
 *   label: string,
 *   amount: number | undefined,
 *   onAmountChange: (value: number | undefined) => void,
 *   currency: string,
 *   onCurrencyChange: (value: string) => void,
 *   amountStatus?: { type: 'error', message: string },
 *   currencyStatus?: { type: 'error', message: string },
 *   isAmountRequired?: boolean,
 *   isDisabled: boolean,
 * }} props `isAmountRequired` false: "Giá trị tờ khai" before the yard
 * stage (the currency is always required).
 */
function MoneyWithCurrency({
  label,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  amountStatus,
  currencyStatus,
  isAmountRequired = true,
  isDisabled,
}) {
  return (
    <HStack gap={2} vAlign="start" wrap="nowrap">
      <StackItem size="fill">
        <FormattedNumberTextInput
          label={label}
          value={amount}
          onChange={onAmountChange}
          units={currency || undefined}
          isRequired={isAmountRequired}
          isDisabled={isDisabled}
          status={amountStatus}
          statusVariant="detached"
        />
      </StackItem>
      <StackItem size="static">
        <Selector
          label="Đơn vị"
          value={currency}
          onChange={(value) => onCurrencyChange(value ?? '')}
          options={currencyOptions}
          width={110}
          isRequired
          isDisabled={isDisabled}
          status={currencyStatus}
          statusVariant="detached"
        />
      </StackItem>
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
  // Stitch body: #faf8ff canvas under white section cards.
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
  // A label-less control beside a labelled field: drop it by one label
  // line so the two controls line up.
  alignWithField: {
    // Field label line (label size × leading) + Field's label gap.
    paddingTop:
      'calc(var(--text-label-size) * var(--text-label-leading) + var(--spacing-1))',
  },
  fullRow: {
    gridColumn: '1 / -1',
  },
  // Section outline: sticky beside the groups, hidden on narrow drawers.
  outline: {
    display: { default: 'none', '@media (min-width: 64rem)': 'flex' },
    flexShrink: 0,
    insetBlockStart: 0,
    position: 'sticky',
    width: '14rem',
  },
  body: { minWidth: 0 },
  // Create steps sit under the drawer title, outside the scrolling body.
  stepper: { minWidth: 0 },
  checkTile: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    gridColumn: '1 / -1',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
    transitionDuration: 'var(--duration-fast)',
    transitionProperty: 'background-color, border-color',
  },
  checkTileOn: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderColor: 'var(--meta-amber-border)',
  },
  checkIcon: {
    backgroundColor: 'var(--meta-neutral-pill-bg)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
    height: 'var(--spacing-9)',
    width: 'var(--spacing-9)',
  },
  checkIconOn: {
    backgroundColor: 'var(--meta-amber-border)',
    color: 'var(--meta-amber-text)',
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
