'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CalendarCheck, CircleCheck, Info, Save, Undo2 } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useShipmentMilestoneMutations } from '../hooks/use-shipment-journey-query.js';

const NOTE_MAX = 500;

/** Local calendar date as ISO "YYYY-MM-DD". */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * @param {import('../types/index.js').ShipmentJourneyStep} step
 * @returns {{ label: string, tone: 'success' | 'accent' | 'neutral' }}
 */
function stepStatePill(step) {
  if (step.isConfirmed) return { label: 'Đã xác nhận tay', tone: 'success' };
  if (step.state === 'Done') return { label: 'Hoàn thành', tone: 'success' };
  if (step.state === 'Current') {
    return { label: 'Chặng hiện tại', tone: 'accent' };
  }
  return { label: 'Kế hoạch', tone: 'neutral' };
}

/**
 * Confirms a journey milestone by hand on its actual date (or re-dates /
 * reopens one already confirmed). The backend keeps the confirmation
 * next to the status and shows the furthest of both. Meta dialog frame
 * (`MetaFormDialog`): milestone / state / scope pills in the header, a
 * boxed "Hoàn thành thực tế" card, a note on how confirmations combine
 * with the status, and — for a confirmed step — a "Bỏ xác nhận" card.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   step: import('../types/index.js').ShipmentJourneyStep,
 * }} props
 */
export function ShipmentMilestoneDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  step,
}) {
  const toast = useAppToast();
  const { confirm, reopen } = useShipmentMilestoneMutations(
    contractId,
    shipmentId,
  );
  const [values, setValues] = useState({
    completedOn: step.completedOn ?? todayIso(),
    note: step.note ?? '',
  });
  const [dateError, setDateError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const statePill = stepStatePill(step);

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if (!values.completedOn) {
      setDateError('Vui lòng chọn ngày hoàn thành');
      return;
    }
    const result = await confirm.mutateAsync({
      milestone: step.milestone,
      ...values,
    });
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: `Đã xác nhận mốc "${step.label}".` });
    onOpenChange(false);
  }

  async function handleReopen() {
    setSubmitError('');
    const result = await reopen.mutateAsync(step.milestone);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: `Đã bỏ xác nhận mốc "${step.label}".` });
    onOpenChange(false);
  }

  return (
    <MetaFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={CalendarCheck}
      title={
        step.isConfirmed ? 'Sửa mốc hành trình' : 'Xác nhận mốc hành trình'
      }
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <MetaPill label={step.label} tone="accent" />
          <MetaPill
            label={statePill.label}
            tone={statePill.tone}
            hasDot={statePill.tone === 'success'}
            hasBorder
          />
          <MetaPill
            label={step.scope === 'Seller' ? 'Phạm vi Seller' : 'Phạm vi Buyer'}
            tone="neutral"
          />
        </HStack>
      }
      width={560}
      draft={values}
      submitLabel={step.isConfirmed ? 'Lưu thay đổi' : 'Xác nhận hoàn thành'}
      submitIcon={step.isConfirmed ? Save : CircleCheck}
      isSubmitting={confirm.isPending || reopen.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        title="Hoàn thành thực tế"
        meta={<MetaPill label="Bắt buộc" tone="accent" />}
      >
        <DateInput
          label="Ngày hoàn thành thực tế"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
              values.completedOn || undefined
            )
          }
          onChange={(value) => {
            setDateError('');
            setValues((current) => ({ ...current, completedOn: value ?? '' }));
          }}
          format={formatDateInputValue}
          isRequired
          status={dateError ? { type: 'error', message: dateError } : undefined}
          statusVariant="detached"
        />
        <VStack gap={1} hAlign="stretch">
          <TextArea
            label="Ghi chú"
            placeholder="Ví dụ: Tàu rời cảng lúc 22:00, trễ 1 ngày"
            value={values.note}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                note: value.slice(0, NOTE_MAX),
              }))
            }
            isOptional
            rows={3}
          />
          <HStack hAlign="end">
            <Text size="xsm" type="code" color="meta-subtle" hasTabularNumbers>
              {values.note.length}/{NOTE_MAX}
            </Text>
          </HStack>
        </VStack>
      </MetaFormSection>

      <HStack gap={2} vAlign="start" wrap="nowrap" xstyle={styles.infoStrip}>
        <Icon icon={Info} size="sm" color="accent" />
        <Text size="sm" color="secondary">
          Hành trình hiển thị mốc xa hơn giữa{' '}
          <Text as="span" size="sm" weight="semibold">
            tình trạng lô hàng
          </Text>{' '}
          và các mốc xác nhận tay.
        </Text>
      </HStack>

      {step.isConfirmed ? (
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          wrap="wrap"
          xstyle={styles.reopenCard}
        >
          <VStack gap={0.5} xstyle={styles.shrink}>
            <Text size="sm" weight="bold">
              Bỏ xác nhận mốc
            </Text>
            <Text size="sm" color="secondary">
              Mốc quay về theo tình trạng lô hàng.
            </Text>
          </VStack>
          <Button
            label="Bỏ xác nhận"
            type="button"
            variant="secondary"
            icon={<Icon icon={Undo2} size="sm" />}
            isDisabled={confirm.isPending || reopen.isPending}
            isLoading={reopen.isPending}
            onClick={handleReopen}
          />
        </HStack>
      ) : null}
    </MetaFormDialog>
  );
}

const styles = stylex.create({
  infoStrip: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
    borderColor: 'var(--meta-accent-tint-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  reopenCard: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--meta-amber-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  shrink: {
    minWidth: 0,
  },
});
