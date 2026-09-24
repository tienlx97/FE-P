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
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { ArrowRight, Plus, Save, ScanLine, Ship, Split } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { currencyOptions } from '../config/currencies.js';
import { paymentTypeOptions } from '../config/payment-schedule-types.js';
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
  labelForShipmentStatus,
  metaToneForShipmentStatus,
  shipmentStatusOptions,
} from '../config/shipment-status.js';
import {
  labelForShipmentType,
  shipmentTypeOptions,
} from '../config/shipment-types.js';
import { useShipmentForm } from '../hooks/use-shipment-form.js';
import { QuickCreateSupplierDialog } from './quick-create-supplier-dialog.jsx';

// Stitch "Chỉnh sửa Shipment" (project 6957224641630765183, screen
// cab96b6c…) drawer width.
const DRAWER_WIDTH = 960;
const TWO_COLUMNS = { minWidth: 280, max: 2 };
const THREE_COLUMNS = { minWidth: 200, max: 3 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** @typedef {import('@astryxdesign/core/Calendar').ISODateString} ISODateString */

/**
 * Meta drawer that creates a shipment under `contract`, or edits one
 * (`shipment`) — Stitch "Chỉnh sửa Shipment"
 * (`.stitch/prompts/meta-shipment-edit-drawer.md`). Replaces the
 * fullscreen `ShipmentFormDialog` on the Meta pages; VGM and costs are
 * managed on the shipment page after creating. Same data and rules as that
 * dialog — `useShipmentForm` (validation, create / update call, supplier
 * list, defaults such as the contract's ports; on edit the cost lines are
 * resent unchanged) — laid out as three boxed sections: "Thông tin lô
 * hàng", "Booking & vận chuyển", "Hải quan & C/O". Field errors sit under
 * each field (detached) and the body scrolls to the first one. Closing with
 * changes asks first. "Loại hình" is only editable when creating.
 *
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   shipment?: import('../types/index.js').Shipment | null,
 *   onClose: () => void,
 *   onSaved?: (shipment: import('../types/index.js').Shipment) => void,
 * }} props
 */
export function ShipmentFormDrawer({
  contract,
  shipment = null,
  onClose,
  onSaved,
}) {
  const isCreating = shipment === null;
  const title = isCreating ? 'Thêm Shipment' : 'Chỉnh sửa Shipment';
  const formId = useId();
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const toast = useAppToast();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const form = useShipmentForm({
    contractId: contract.id,
    contract,
    shipment,
    onSuccess: (saved) => {
      toast({
        body: isCreating ? 'Đã tạo Shipment.' : 'Đã cập nhật Shipment.',
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
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const isDisabled = form.isSubmitting;

  const supplierOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.companyName,
  }));
  const quantityUnit = quantityUnitForShipmentType(values.type);
  const transitDays =
    values.etd && values.eta
      ? Math.round((Date.parse(values.eta) - Date.parse(values.etd)) / DAY_MS)
      : null;

  function requestClose() {
    if (isDirty) setIsConfirmingDiscard(true);
    else onClose();
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    await form.handleSubmit(event);
    // Bring the first invalid field into view (long form).
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /**
   * Shared props of a field with a detached error line.
   * @param {string} key
   */
  const statusOf = (key) => ({
    status: fieldStatuses[key],
    statusVariant: /** @type {const} */ ('detached'),
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
              <MetaDrawerHeader
                icon={Ship}
                title={title}
                meta={
                  shipment ? (
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Text size="sm" weight="bold" color="accent" type="code">
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
                      <Text size="sm" weight="bold" color="accent" type="code">
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
                    index={1}
                    title="Thông tin lô hàng"
                    meta={<MetaPill label="Bắt buộc" tone="accent" />}
                  >
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
                      <TextInput
                        label="Số hoá đơn thương mại"
                        placeholder="Ví dụ: INV-26KCT-01"
                        value={values.invoiceNumber}
                        onChange={(value) => setField('invoiceNumber', value)}
                        isOptional
                        isDisabled={isDisabled}
                        width="100%"
                        {...statusOf('invoiceNumber')}
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
                        isDisabled={isDisabled}
                      />
                    </Grid>

                    <Grid columns={THREE_COLUMNS} gap={4}>
                      <FormattedNumberTextInput
                        label="Tỷ giá tờ khai"
                        value={values.declarationExchangeRate}
                        onChange={(value) =>
                          setField('declarationExchangeRate', value)
                        }
                        units="đ"
                        isRequired
                        isDisabled={isDisabled}
                        {...statusOf('declarationExchangeRate')}
                      />
                      <FormattedNumberTextInput
                        label="Số lượng"
                        value={values.quantityAmount}
                        onChange={(value) => setField('quantityAmount', value)}
                        units={
                          quantityUnit
                            ? labelForShipmentQuantityUnit(quantityUnit)
                            : undefined
                        }
                        isRequired
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
                        isRequired
                        isDisabled={isDisabled}
                        {...statusOf('declarationWeightKg')}
                      />
                    </Grid>
                  </MetaFormSection>

                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    index={2}
                    title="Booking & vận chuyển"
                    meta="Các trường dấu hoa thị là bắt buộc"
                  >
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
                        onChange={(value) => setField('truckingIds', value)}
                        options={supplierOptions}
                        isOptional
                        isDisabled={isDisabled}
                      />
                      <TextInput
                        label="Số booking"
                        value={values.bookingNumber}
                        onChange={(value) => setField('bookingNumber', value)}
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
                        onChange={(value) => setField('shippingLine', value)}
                        isOptional
                        isDisabled={isDisabled}
                        width="100%"
                        {...statusOf('shippingLine')}
                      />
                      <TextInput
                        label="Tên tàu"
                        placeholder="Ví dụ: KMTC JAKARTA // 2604S"
                        value={values.vesselName}
                        onChange={(value) => setField('vesselName', value)}
                        isOptional
                        isDisabled={isDisabled}
                        width="100%"
                        {...statusOf('vesselName')}
                      />
                      <TextInput
                        label="Số chuyến"
                        placeholder="Ví dụ: 2604S"
                        value={values.voyageNumber}
                        onChange={(value) => setField('voyageNumber', value)}
                        isOptional
                        isDisabled={isDisabled}
                        width="100%"
                        {...statusOf('voyageNumber')}
                      />
                      <HStack gap={2} vAlign="start" wrap="nowrap">
                        <StackItem size="fill">
                          <DateInput
                            label="Hạn nộp SI / VGM"
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
                            isDisabled={isDisabled}
                          />
                        </VStack>
                      </HStack>
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
                      <VStack gap={2} hAlign="stretch">
                        <Text size="sm" weight="semibold">
                          Phương thức vận chuyển
                        </Text>
                        <SegmentedControl
                          label="Phương thức vận chuyển"
                          layout="fill"
                          value={
                            values.isTransshipment ? 'transshipment' : 'direct'
                          }
                          onChange={(value) =>
                            setField(
                              'isTransshipment',
                              value === 'transshipment',
                            )
                          }
                          isDisabled={isDisabled}
                        >
                          <SegmentedControlItem
                            value="direct"
                            label="Đi thẳng (Direct)"
                            icon={<Icon icon={ArrowRight} size="sm" />}
                          />
                          <SegmentedControlItem
                            value="transshipment"
                            label="Chuyển tải"
                            icon={<Icon icon={Split} size="sm" />}
                          />
                        </SegmentedControl>
                      </VStack>
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
                    {transitDays !== null && transitDays >= 0 ? (
                      <Text size="sm" color="meta-subtle">
                        Dự kiến transit: {transitDays} ngày
                      </Text>
                    ) : null}

                    <Grid columns={TWO_COLUMNS} gap={4}>
                      <DateInput
                        label="Hạn trả cont rỗng (Demurrage/Detention)"
                        value={dateValue('emptyReturnDeadline')}
                        onChange={(value) =>
                          setField('emptyReturnDeadline', value ?? '')
                        }
                        format={formatDateInputValue}
                        isOptional
                        isDisabled={isDisabled}
                        {...statusOf('emptyReturnDeadline')}
                      />
                      <TextInput
                        label="Cảng/nơi xếp hàng (POL)"
                        value={values.placeOfLoading}
                        onChange={(value) => setField('placeOfLoading', value)}
                        isOptional
                        isDisabled={isDisabled}
                        width="100%"
                        {...statusOf('placeOfLoading')}
                      />
                      <VStack hAlign="stretch" xstyle={styles.fullRow}>
                        <TextInput
                          label="Cảng/nơi đến (POD)"
                          value={values.placeOfDischarge}
                          onChange={(value) =>
                            setField('placeOfDischarge', value)
                          }
                          isOptional
                          isDisabled={isDisabled}
                          width="100%"
                          {...statusOf('placeOfDischarge')}
                        />
                      </VStack>
                    </Grid>
                  </MetaFormSection>

                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    index={3}
                    title="Hải quan & C/O"
                    meta="Do hải quan cấp, tự nhập"
                  >
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
                  </MetaFormSection>
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
                  <Button
                    label={isCreating ? 'Tạo Shipment' : 'Lưu thay đổi'}
                    type="submit"
                    form={formId}
                    variant="primary"
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
 *   isDisabled: boolean,
 * }} props
 */
function MoneyWithCurrency({
  label,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  amountStatus,
  currencyStatus,
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
          isRequired
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
    paddingTop: 'calc(var(--spacing-5) + var(--spacing-1-5))',
  },
  fullRow: {
    gridColumn: '1 / -1',
  },
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
