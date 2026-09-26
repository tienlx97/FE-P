'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { DialogHeader } from '@astryxdesign/core/Dialog';
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
import { CalendarRange, CopyCheck, Save } from 'lucide-react';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaCompactTable,
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  containerDateFields,
  containerDatesRows,
} from '../config/shipment-container-dates.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useRecordShipmentContainerDatesMutation } from '../hooks/use-shipment-vgms-query.js';

const DRAWER_WIDTH = 960;

/** @param {string} value */
const isoDate = (value) =>
  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
    value || undefined
  );

/**
 * "Ngày container" (Meta drawer): the event dates that start / stop each
 * container's free time — empty pickup, gate-in, destination gate-out
 * (separate destination DEM / DET only), empty return + depot. "Nhập
 * nhanh" fills one date into every container (most containers of a lot
 * move on the same day); "Từng container" is a table, one row per
 * container, to fix the odd ones.
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   incoterm: import('../types/index.js').Incoterm,
 *   containers: import('../types/index.js').ShipmentVgm[],
 *   onClose: () => void,
 * }} props
 */
export function ShipmentContainerDatesDrawer({
  contractId,
  shipment,
  incoterm,
  containers,
  onClose,
}) {
  const formId = useId();
  const toast = useAppToast();
  const mutation = useRecordShipmentContainerDatesMutation(
    contractId,
    shipment.id,
  );
  const fields = containerDateFields(
    incoterm,
    shipment.operationalDetails?.destinationFreeTime,
  );
  const hasReturn = fields.some((field) => field.key === 'emptyReturnedOn');
  const [initialRows] = useState(() => containerDatesRows(containers));
  const [rows, setRows] = useState(initialRows);
  const [bulkField, setBulkField] = useState(
    /** @type {string} */ (fields[0]?.key ?? ''),
  );
  const [bulkDate, setBulkDate] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(initialRows);

  function requestClose() {
    if (isDirty) setIsConfirmingDiscard(true);
    else onClose();
  }

  /**
   * @param {string} vgmId
   * @param {keyof import('../types/index.js').ContainerDatesFormRow} field
   * @param {string} value
   */
  function setRow(vgmId, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.vgmId === vgmId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function applyToAll() {
    const field =
      /** @type {keyof import('../types/index.js').ContainerDatesFormRow} */ (
        bulkField
      );
    setRows((current) => current.map((row) => ({ ...row, [field]: bulkDate })));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const result = await mutation.mutateAsync(rows);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: 'Đã lưu ngày container.' });
    onClose();
  }

  const tableRows = rows.map((row, index) => {
    const container = containers.find((item) => item.id === row.vgmId);
    return {
      id: row.vgmId,
      cells: {
        container: (
          <VStack gap={0.5}>
            <Text type="code" weight="bold">
              {row.containerNumber}
            </Text>
            <Text size="sm" color="secondary">
              #{index + 1}
              {container
                ? ` · ${labelForShipmentContainerType(container.containerType)}`
                : ''}
            </Text>
          </VStack>
        ),
        ...Object.fromEntries(
          fields.map((field) => [
            field.key,
            <DateInput
              key={field.key}
              label={`${field.label} — ${row.containerNumber}`}
              isLabelHidden
              value={isoDate(row[field.key])}
              onChange={(value) => setRow(row.vgmId, field.key, value ?? '')}
              format={formatDateInputValue}
              hasClear
              size="sm"
              width="100%"
            />,
          ]),
        ),
        depot: hasReturn ? (
          <TextInput
            label={`Depot trả rỗng — ${row.containerNumber}`}
            isLabelHidden
            placeholder="Tên depot"
            value={row.emptyReturnDepot}
            onChange={(value) => setRow(row.vgmId, 'emptyReturnDepot', value)}
            isDisabled={!row.emptyReturnedOn}
            size="sm"
            width="100%"
          />
        ) : null,
      },
    };
  });

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
        label="Ngày container"
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={CalendarRange}
                title="Ngày container"
                meta={
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text size="sm" weight="bold" color="accent" type="code">
                      {shipment.shipmentCode}
                    </Text>
                    {fields.map((field) => {
                      const done = rows.filter((row) => row[field.key]).length;
                      const isAll = rows.length > 0 && done === rows.length;
                      return (
                        <MetaPill
                          key={field.key}
                          label={`${field.shortLabel} ${done}/${rows.length}`}
                          tone={isAll ? 'success' : 'neutral'}
                          hasDot={isAll}
                        />
                      );
                    })}
                  </HStack>
                }
                onClose={requestClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              <form
                id={formId}
                onSubmit={handleSubmit}
                noValidate
                {...stylex.props(styles.fields)}
              >
                <VStack gap={4} hAlign="stretch">
                  {submitError ? (
                    <Banner status="error" title={submitError} container="card" />
                  ) : null}
                  {rows.length === 0 || fields.length === 0 ? (
                    <MetaFormSection isBoxed isTitleUppercase={false} title="Container">
                      <Text color="secondary">
                        {rows.length === 0
                          ? 'Lô hàng chưa có container — thêm ở tab VGM.'
                          : 'Incoterm này không cần theo dõi ngày container.'}
                      </Text>
                    </MetaFormSection>
                  ) : (
                    <>
                      <MetaFormSection
                        isBoxed
                        isTitleUppercase={false}
                        index={1}
                        title="Nhập nhanh"
                        meta="Điền một ngày cho mọi container"
                      >
                        <HStack gap={3} vAlign="end" wrap="wrap">
                          <Selector
                            label="Loại ngày"
                            value={bulkField}
                            onChange={setBulkField}
                            options={fields.map((field) => ({
                              value: field.key,
                              label: field.label,
                            }))}
                          />
                          <DateInput
                            label="Ngày"
                            value={isoDate(bulkDate)}
                            onChange={(value) => setBulkDate(value ?? '')}
                            format={formatDateInputValue}
                            hasClear
                          />
                          <Button
                            label="Áp dụng cho tất cả"
                            type="button"
                            variant="secondary"
                            icon={<Icon icon={CopyCheck} size="sm" />}
                            onClick={applyToAll}
                          />
                        </HStack>
                      </MetaFormSection>

                      <MetaFormSection
                        isBoxed
                        isTitleUppercase={false}
                        index={2}
                        title="Từng container"
                        meta="Để trống = chưa xảy ra"
                      >
                        <MetaCompactTable
                          columns={[
                            { key: 'container', header: 'Container' },
                            ...fields.map((field) => ({
                              key: field.key,
                              header: field.label,
                            })),
                            ...(hasReturn
                              ? [{ key: 'depot', header: 'Depot trả rỗng' }]
                              : []),
                          ]}
                          rows={tableRows}
                          emptyLabel="Lô hàng chưa có container."
                        />
                      </MetaFormSection>
                    </>
                  )}
                </VStack>
              </form>
            </LayoutContent>
          }
          footer={
            <LayoutFooter padding={4}>
              <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
                <HStack gap={2} vAlign="center" wrap="nowrap" xstyle={styles.hint}>
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
                    isDisabled={mutation.isPending}
                    onClick={requestClose}
                  />
                  <Button
                    label="Lưu ngày container"
                    type="submit"
                    form={formId}
                    variant="primary"
                    size="lg"
                    icon={<Icon icon={Save} size="sm" />}
                    isLoading={mutation.isPending}
                    isDisabled={rows.length === 0 || fields.length === 0}
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
              <Text>Những ngày vừa nhập sẽ mất nếu đóng lại.</Text>
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

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
  },
  // Same roomy controls as the other Meta drawers.
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
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
