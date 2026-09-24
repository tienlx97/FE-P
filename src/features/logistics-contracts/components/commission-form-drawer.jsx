'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
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
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { BadgeCheck, ChevronDown, Handshake, Pencil } from 'lucide-react';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaBankAccountCard,
  MetaDrawerHeader,
  MetaFormSection,
  MetaPartySummary,
  MetaPaymentSplitBar,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { labelForContractType } from '../config/contract-types.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionForm } from '../hooks/use-commission-form.js';
import { CommissionPaymentHistoryCards } from './commission-payment-history-cards.jsx';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

// Figma 104:5399 drawer width.
const DRAWER_WIDTH = 960;
const TWO_COLUMNS = { minWidth: 240, max: 2 };
const PERCENT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  // Figma body: muted canvas under white section cards.
  canvas: {
    backgroundColor: 'var(--color-background-muted)',
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
  // Framed like the inputs around it (white, emphasized border, field
  // height / radius) instead of a tinted tile on the white section card.
  checkTile: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-field-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minHeight: 'var(--meta-field-height)',
    paddingInline: 'var(--spacing-3)',
  },
  splitPanel: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  // Quiet full-width reference line under the commission value.
  infoBar: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-1-5)',
    paddingInline: 'var(--spacing-3)',
  },
  dot: {
    backgroundColor: 'var(--meta-amber)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  hint: {
    minWidth: 0,
  },
});

/**
 * Meta create / edit drawer for a contract's `Commission` (Figma 104:5399,
 * "Tạo Thỏa thuận Hoa hồng"): three boxed sections — basic info & broker
 * (with the broker's first bank account), payment terms (split bar +
 * `PaymentTermsFields`) and payment history — over `useCommissionForm`, so
 * validation, the duplicate-code check and the create/update calls are the
 * same as `CommissionFormDialog`. Creating closes on success; editing
 * closes too (the detail tab shows the saved record). `initialMode="view"`
 * (the tab's "Xem") shows the same drawer read-only — controls locked, no
 * add / remove / change actions, steps as summaries — with "Chỉnh sửa" in
 * the footer switching it to edit in place.
 * Not in the data, so not rendered: broker verification badge, VND
 * conversion / exchange rate, "Thêm tài khoản" (bank accounts are managed on
 * the supplier), per-step long description separate from the condition.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   commission?: import('../types/index.js').Commission | null,
 *   onClose: () => void,
 *   onSuccess?: (commission: import('../types/index.js').Commission) => void,
 *   initialMode?: 'view' | 'edit',
 * }} props
 */
export function CommissionFormDrawer({
  contract,
  commission = null,
  onClose,
  onSuccess,
  initialMode = 'edit',
}) {
  const formId = useId();
  const [mode, setMode] = useState(initialMode);
  const isViewing = mode === 'view' && commission !== null;
  const toast = useAppToast();
  const [isPickingBroker, setIsPickingBroker] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const form = useCommissionForm({
    contractId: contract.id,
    commission,
    onSuccess: (saved) => {
      toast({
        body: commission ? 'Đã cập nhật Commission.' : 'Đã tạo Commission.',
      });
      onSuccess?.(saved);
      onClose();
    },
  });
  const { values, setField, paymentTermRows } = form;
  // Same widening as `CommissionFields`' props: the hook's inferred status
  // map only names `code`.
  const fieldStatuses =
    /** @type {Record<string, { type: 'error' | 'success', message: string } | undefined>} */ (
      form.fieldStatuses
    );
  const brokers = /** @type {import('../types/index.js').Supplier[]} */ (
    form.customers
  );
  const currency = contract.currency;

  const broker = brokers.find(
    (customer) => customer.id === values.partyCustomerId,
  );
  const bankAccount = broker?.bankAccounts?.[0];
  const ratioOfContract =
    typeof values.value === 'number' && contract.contractValue > 0
      ? (values.value / contract.contractValue) * 100
      : null;
  const totalPercent = paymentTermRows.totalPercent;
  const isBalanced = Math.abs(totalPercent - 100) < 0.01;
  const stepCount = paymentTermRows.rows.length;
  const paidTotal = form.paymentHistoryRows.rows.reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );
  const paidShare =
    typeof values.value === 'number' && values.value > 0
      ? (paidTotal / values.value) * 100
      : null;

  function requestClose() {
    if (form.isDirty) setIsConfirmingDiscard(true);
    else onClose();
  }

  const brokerPicker = (
    <Selector
      label="Bên nhận hoa hồng (Môi giới / Broker)"
      hasSearch
      placeholder="Chọn nhà cung cấp"
      value={values.partyCustomerId}
      onChange={(value) => {
        setField('partyCustomerId', value ?? '');
        if (value) setIsPickingBroker(false);
      }}
      options={brokers.map((customer) => ({
        value: customer.id,
        label: customer.companyName,
      }))}
      isRequired
      status={fieldStatuses.partyCustomerId}
      statusVariant="tooltip"
      width="100%"
    />
  );

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
        label={
          isViewing
            ? 'Chi tiết Commission'
            : commission
              ? 'Cập nhật Commission'
              : 'Tạo Commission'
        }
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={Handshake}
                title={
                  isViewing
                    ? `Commission · ${commission.code}`
                    : commission
                      ? `Cập nhật Commission · ${commission.code}`
                      : 'Tạo Thỏa thuận Hoa hồng (Commission)'
                }
                titleBadge={
                  <MetaPill
                    label={`HĐ ${labelForContractType(contract.contractType).toLocaleLowerCase('vi')}`}
                    tone="accent"
                  />
                }
                meta={
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text size="sm" color="secondary">
                      Hợp đồng gốc:
                    </Text>
                    <MetaPill label={contract.contractNumber} tone="accent" />
                    <Text size="sm" color="secondary" aria-hidden>
                      •
                    </Text>
                    <Text size="sm" color="secondary" maxLines={1}>
                      Dự án: {contract.projectName}
                    </Text>
                    <Text size="sm" color="secondary" aria-hidden>
                      •
                    </Text>
                    <MetaPill label={currency} tone="success" hasDot />
                  </HStack>
                }
                onClose={requestClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={6} xstyle={styles.canvas}>
              <form
                id={formId}
                onSubmit={form.handleSubmit}
                {...stylex.props(styles.fields)}
              >
                <VStack gap={5} hAlign="stretch">
                  {form.submitError ? (
                    <Banner
                      status="error"
                      title={form.submitError}
                      container="card"
                    />
                  ) : null}

                  <MetaFormSection
                    isBoxed
                    title="Thông tin cơ bản & môi giới"
                    meta={
                      isViewing ? undefined : (
                        <MetaPill label="Bắt buộc" tone="accent" />
                      )
                    }
                  >
                    <Grid columns={TWO_COLUMNS} gap={4}>
                      <TextInput
                        label="Mã Commission"
                        value={values.code}
                        onChange={(value) => setField('code', value)}
                        isReadOnly={isViewing}
                        isRequired={!isViewing}
                        isLoading={!isViewing && form.isCheckingCode}
                        status={isViewing ? undefined : fieldStatuses.code}
                        statusVariant="tooltip"
                      />
                      <ReadOnlyLock isActive={isViewing}>
                        <DateInput
                          label="Ngày ký thỏa thuận"
                          format={formatDateInputValue}
                          value={
                            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                              values.signedDate
                            )
                          }
                          onChange={(value) =>
                            setField('signedDate', value ?? '')
                          }
                          isRequired={!isViewing}
                          status={fieldStatuses.signedDate}
                          statusVariant="tooltip"
                          width="100%"
                        />
                      </ReadOnlyLock>
                    </Grid>

                    {broker && (isViewing || !isPickingBroker) ? (
                      <VStack gap={1} hAlign="stretch">
                        <HStack gap={1} vAlign="center" wrap="wrap">
                          <Text weight="medium">
                            Bên nhận hoa hồng (Môi giới / Broker)
                          </Text>
                          {isViewing ? null : (
                            <Text size="sm" color="secondary">
                              · Bắt buộc
                            </Text>
                          )}
                        </HStack>
                        <MetaPartySummary
                          name={broker.companyName}
                          details={[
                            broker.profile?.taxCode
                              ? `MST: ${broker.profile.taxCode}`
                              : '',
                            broker.address ?? '',
                          ].filter(Boolean)}
                          action={
                            isViewing ? undefined : (
                              <Button
                                label="Thay đổi"
                                variant="ghost"
                                size="sm"
                                type="button"
                                icon={<Icon icon={ChevronDown} size="sm" />}
                                onClick={() => setIsPickingBroker(true)}
                              />
                            )
                          }
                        />
                      </VStack>
                    ) : (
                      brokerPicker
                    )}

                    {broker ? (
                      <MetaBankAccountCard
                        title="Tài khoản ngân hàng thụ hưởng"
                        account={
                          bankAccount
                            ? {
                                bankName: bankAccount.bankName,
                                branch: [
                                  bankAccount.branch,
                                  bankAccount.province,
                                ]
                                  .filter(Boolean)
                                  .join(', '),
                                accountNumber: bankAccount.accountNumber,
                                holder:
                                  broker.companyName.toLocaleUpperCase('vi'),
                              }
                            : null
                        }
                        emptyText="Nhà cung cấp này chưa có tài khoản ngân hàng — thêm trong danh mục Nhà cung cấp."
                        onCopy={(accountNumber) => {
                          navigator.clipboard?.writeText(accountNumber);
                          toast({ body: 'Đã sao chép số tài khoản.' });
                        }}
                      />
                    ) : null}

                    <VStack gap={1} hAlign="stretch">
                      <HStack
                        hAlign="between"
                        vAlign="center"
                        gap={2}
                        wrap="wrap"
                      >
                        <HStack gap={1} vAlign="center" wrap="wrap">
                          <Text weight="medium">
                            Tổng giá trị hoa hồng cam kết
                          </Text>
                          {isViewing ? null : (
                            <Text size="sm" color="secondary">
                              · Bắt buộc
                            </Text>
                          )}
                        </HStack>
                        {ratioOfContract !== null ? (
                          <MetaPill
                            label={`Tỷ lệ: ${PERCENT.format(ratioOfContract)}% tổng trị giá HĐ gốc`}
                            tone="accent"
                          />
                        ) : null}
                      </HStack>
                      <VStack gap={2} hAlign="stretch">
                        <FormattedNumberTextInput
                          label="Tổng giá trị hoa hồng cam kết"
                          isLabelHidden
                          value={values.value}
                          onChange={(value) => setField('value', value)}
                          units={currency || undefined}
                          isReadOnly={isViewing}
                          isRequired={!isViewing}
                          status={fieldStatuses.value}
                          statusVariant="tooltip"
                        />
                        <HStack
                          hAlign="between"
                          vAlign="center"
                          gap={2}
                          wrap="wrap"
                          xstyle={styles.infoBar}
                        >
                          <Text size="sm" color="secondary">
                            Giá trị HĐ gốc
                          </Text>
                          <Text size="sm" weight="bold" hasTabularNumbers>
                            {formatMoney(contract.contractValue, currency)}
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>

                    <Grid columns={TWO_COLUMNS} gap={3}>
                      <HStack vAlign="center" xstyle={styles.checkTile}>
                        <ReadOnlyLock isActive={isViewing}>
                          <CheckboxInput
                            label="Bên bán ký"
                            value={values.sellerSigned}
                            onChange={(checked) =>
                              setField('sellerSigned', checked)
                            }
                          />
                        </ReadOnlyLock>
                      </HStack>
                      <HStack vAlign="center" xstyle={styles.checkTile}>
                        <ReadOnlyLock isActive={isViewing}>
                          <CheckboxInput
                            label="Bên môi giới ký"
                            value={values.partySigned}
                            onChange={(checked) =>
                              setField('partySigned', checked)
                            }
                          />
                        </ReadOnlyLock>
                      </HStack>
                    </Grid>
                  </MetaFormSection>

                  <MetaFormSection
                    isBoxed
                    title="Kế hoạch đợt thanh toán (Payment terms)"
                    meta={
                      <MetaPill
                        label={`Tổng cam kết: ${PERCENT.format(totalPercent)}% (${stepCount} mốc)`}
                        tone={isBalanced ? 'success' : 'muted'}
                        icon={isBalanced ? BadgeCheck : undefined}
                      />
                    }
                  >
                    <VStack hAlign="stretch" xstyle={styles.splitPanel}>
                      <MetaPaymentSplitBar
                        hasLegend
                        label="Phân bổ:"
                        totalLabel={
                          isBalanced
                            ? '100% / 100% — Đạt chuẩn thanh toán'
                            : `${PERCENT.format(totalPercent)}% / 100% — Chưa đủ 100%`
                        }
                        isBalanced={isBalanced}
                        ratios={paymentTermRows.rows.map(
                          (row) => row.paymentRatioPercent || 0,
                        )}
                      />
                    </VStack>
                    <PaymentTermsFields
                      rows={paymentTermRows.rows}
                      status={fieldStatuses.paymentTerms}
                      contractValue={values.value}
                      currency={currency}
                      isReadOnly={isViewing}
                      onAddRow={paymentTermRows.addRow}
                      onRemoveRow={paymentTermRows.removeRow}
                      onUpdateRowField={paymentTermRows.updateRowField}
                    />
                  </MetaFormSection>

                  <MetaFormSection
                    isBoxed
                    title="Lịch sử thanh toán & chứng từ"
                    meta={
                      <Text size="sm" color="secondary">
                        Đã giải ngân:{' '}
                        <Text as="span" size="sm" weight="bold" color="accent">
                          {formatMoney(paidTotal, currency)}
                        </Text>
                        {' / '}
                        {formatMoney(values.value ?? 0, currency)}
                        {paidShare !== null
                          ? ` (${PERCENT.format(paidShare)}%)`
                          : ''}
                      </Text>
                    }
                  >
                    <CommissionPaymentHistoryCards
                      rows={form.paymentHistoryRows.rows}
                      status={fieldStatuses.paymentHistory}
                      currency={currency}
                      isReadOnly={isViewing}
                      onAddRow={form.paymentHistoryRows.addRow}
                      onRemoveRow={form.paymentHistoryRows.removeRow}
                      onUpdateRowField={form.paymentHistoryRows.updateRowField}
                    />
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
                  {form.isDirty ? (
                    <HStack as="span" xstyle={styles.dot} />
                  ) : null}
                  <Text size="sm" color="secondary">
                    {isViewing
                      ? 'Chế độ xem'
                      : form.isDirty
                        ? 'Có thay đổi chưa lưu'
                        : 'Chưa có thay đổi'}
                  </Text>
                </HStack>
                {/* Distinct keys: reusing the clicked "Chỉnh sửa" <button> as
                    the submit button would let the browser's click
                    activation submit the form right after the switch. */}
                {isViewing ? (
                  <HStack key="view" gap={2} vAlign="center" wrap="nowrap">
                    <Button
                      label="Đóng"
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={onClose}
                    />
                    <Button
                      label="Chỉnh sửa"
                      type="button"
                      variant="primary"
                      size="lg"
                      icon={<Icon icon={Pencil} size="sm" />}
                      onClick={() => setMode('edit')}
                    />
                  </HStack>
                ) : (
                  <HStack key="edit" gap={2} vAlign="center" wrap="nowrap">
                    <Button
                      label="Huỷ bỏ"
                      variant="secondary"
                      size="lg"
                      isDisabled={form.isSubmitting}
                      onClick={requestClose}
                    />
                    <Button
                      label={form.submitLabel}
                      type="submit"
                      form={formId}
                      variant="primary"
                      size="lg"
                      icon={<Icon icon={BadgeCheck} size="sm" />}
                      isLoading={form.isSubmitting}
                    />
                  </HStack>
                )}
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
