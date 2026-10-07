'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { FileInput } from '@astryxdesign/core/FileInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import {
  CopyCheck,
  Download,
  ListPlus,
  PanelBottomOpen,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import {
  MetaCompactTable,
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  BULK_CONTAINER_COLUMNS,
  bulkContainerGuideRows,
  bulkRowVgmState,
  emptyBulkContainerRow,
  parseBulkContainerRows,
  validateBulkContainerRows,
} from '../config/bulk-containers.js';
import { shipmentContainerTypeOptions } from '../config/shipment-container-types.js';
import { useBulkCreateShipmentVgmsMutation } from '../hooks/use-shipment-vgms-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import {
  ShipmentVgmAdditionalFields,
  ShipmentVgmDeclarationFields,
} from './shipment-vgm-fields.jsx';

const WEIGHT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/** @param {string} value */
const isoDate = (value) =>
  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
    value || undefined
  );

/**
 * "Thêm danh sách container" (`MetaFormDrawer`): up to 100 containers in
 * one atomic save, typed in or imported from Excel. The Excel template has
 * every container field (`BULK_CONTAINER_COLUMNS`) plus guide and carrier
 * sheets; a "Xuất Excel" file imports back too. The table edits the
 * identity columns inline and shows each row's VGM state; "Chi tiết"
 * opens that row's VGM weights, times and note below the table (the same
 * fields as `ShipmentVgmDrawer`). "Nhập nhanh" fills the carrier or
 * packing date of every row. Rows are validated with the single-container
 * rules before the request; invalid cells show inline.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   shipmentCode: string,
 *   existingNumbers: string[],
 *   mode: 'table' | 'excel',
 *   onClose: () => void,
 * }} props
 */
export function ShipmentVgmBulkDrawer({
  contractId,
  shipmentId,
  shipmentCode,
  existingNumbers,
  mode,
  onClose,
}) {
  const toast = useAppToast();
  const mutation = useBulkCreateShipmentVgmsMutation(contractId, shipmentId);
  const suppliersQuery = useSuppliersQuery();
  const carriers = /** @type {import('../types/index.js').Customer[]} */ (
    suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []
  );
  const carrierOptions = carriers.map((carrier) => ({
    value: carrier.id,
    label: carrier.companyName,
  }));

  const [rows, setRows] = useState(
    /** @type {import('../types/index.js').BulkContainerRow[]} */ (
      mode === 'table' ? [emptyBulkContainerRow()] : []
    ),
  );
  const [selectedId, setSelectedId] = useState(
    /** @type {string | null} */ (null),
  );
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [issues, setIssues] = useState(
    /** @type {import('../config/bulk-containers.js').BulkContainerIssue[]} */ ([]),
  );
  const [quickCarrier, setQuickCarrier] = useState('');
  const [quickDate, setQuickDate] = useState('');

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const selectedLine = selected ? rows.indexOf(selected) + 1 : 0;

  /**
   * @param {string} rowId
   * @returns {Record<string, { type: 'error', message: string } | undefined>}
   */
  const statusesFor = (rowId) =>
    Object.fromEntries(
      issues
        .filter((issue) => issue.rowId === rowId && issue.field)
        .map((issue) => [
          /** @type {string} */ (issue.field),
          { type: /** @type {const} */ ('error'), message: issue.message },
        ]),
    );

  /**
   * @template {keyof import('../types/index.js').BulkContainerRow} K
   * @param {string} rowId
   * @param {K} field
   * @param {import('../types/index.js').BulkContainerRow[K]} value
   */
  function setRowField(rowId, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
              // A carrier picked from the catalog replaces an unmatched
              // Excel name.
              ...(field === 'carrierCustomerId' ? { carrierName: '' } : {}),
            }
          : row,
      ),
    );
    setIssues((current) =>
      current.filter(
        (issue) => !(issue.rowId === rowId && issue.field === field),
      ),
    );
  }

  function addRow() {
    const row = emptyBulkContainerRow(crypto.randomUUID());
    setRows((current) => [...current, row]);
  }

  /** @param {string} rowId */
  function removeRow(rowId) {
    setRows((current) => current.filter((row) => row.id !== rowId));
    setIssues((current) => current.filter((issue) => issue.rowId !== rowId));
    if (selectedId === rowId) setSelectedId(null);
  }

  /** @param {'carrierCustomerId' | 'packingDate'} field @param {string} value */
  function applyToAll(field, value) {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        [field]: value,
        ...(field === 'carrierCustomerId' ? { carrierName: '' } : {}),
      })),
    );
    setIssues((current) => current.filter((issue) => issue.field !== field));
  }

  async function downloadTemplate() {
    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      BULK_CONTAINER_COLUMNS.map((column) => column.header),
    ]);
    sheet['!cols'] = BULK_CONTAINER_COLUMNS.map((column) => ({
      wch: column.width,
    }));
    XLSX.utils.book_append_sheet(book, sheet, 'Containers');
    const guide = XLSX.utils.aoa_to_sheet(
      bulkContainerGuideRows(shipmentContainerTypeOptions),
    );
    guide['!cols'] = [{ wch: 26 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(book, guide, 'Hướng dẫn');
    const carrierSheet = XLSX.utils.aoa_to_sheet([
      ['Nhà vận chuyển'],
      ...carriers.map((carrier) => [carrier.companyName]),
    ]);
    carrierSheet['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(book, carrierSheet, 'Nhà vận chuyển');
    XLSX.writeFile(book, 'mau-danh-sach-container.xlsx');
  }

  /** @param {File | null} next */
  async function importFile(next) {
    setFile(next);
    setFileError('');
    setIssues([]);
    if (!next) return;
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await next.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Tệp Excel không có sheet dữ liệu.');
      const records = /** @type {Record<string, unknown>[]} */ (
        XLSX.utils.sheet_to_json(sheet, { defval: '' })
      );
      const parsed = parseBulkContainerRows(records, carriers);
      if (parsed.length === 0) {
        throw new Error(
          'Không tìm thấy dòng container. Kiểm tra tên cột theo tệp mẫu.',
        );
      }
      setRows(parsed);
      setSelectedId(null);
      setIssues(validateBulkContainerRows(parsed, existingNumbers));
    } catch (cause) {
      setFileError(
        cause instanceof Error ? cause.message : 'Không thể đọc tệp Excel.',
      );
    }
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const validation = validateBulkContainerRows(rows, existingNumbers);
    setIssues(validation);
    if (validation.length > 0) return;
    const result = await mutation.mutateAsync(rows);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: `Đã thêm ${result.vgms.length} container.` });
    onClose();
  }

  const declaredCount = rows.filter(
    (row) => bulkRowVgmState(row).state === 'declared',
  ).length;
  const errorRowCount = new Set(
    issues.filter((issue) => issue.rowId).map((issue) => issue.rowId),
  ).size;
  const columnLabel = Object.fromEntries(
    BULK_CONTAINER_COLUMNS.map((column) => [column.key, column.header]),
  );

  const tableRows = rows.map((row, index) => {
    const line = index + 1;
    const statuses = statusesFor(row.id);
    const hasIssue = issues.some((issue) => issue.rowId === row.id);
    const vgmState = bulkRowVgmState(row);
    const isSelected = row.id === selectedId;
    return {
      id: row.id,
      cells: {
        no: (
          <MetaPill
            label={String(line)}
            tone={hasIssue ? 'danger' : isSelected ? 'accent' : 'neutral'}
            size="sm"
          />
        ),
        containerNumber: (
          <TextInput
            label={`Số container dòng ${line}`}
            isLabelHidden
            value={row.containerNumber}
            onChange={(value) => setRowField(row.id, 'containerNumber', value)}
            placeholder="TCLU1234567"
            status={statuses.containerNumber}
            statusVariant="tooltip"
            width={170}
          />
        ),
        containerType: (
          <Selector
            label={`Loại cont dòng ${line}`}
            isLabelHidden
            value={row.containerType}
            onChange={(value) =>
              setRowField(
                row.id,
                'containerType',
                /** @type {import('../types/index.js').ShipmentContainerType | ''} */ (
                  value ?? ''
                ),
              )
            }
            options={shipmentContainerTypeOptions}
            status={statuses.containerType}
            statusVariant="tooltip"
            width={110}
          />
        ),
        sealNumber: (
          <TextInput
            label={`Số seal dòng ${line}`}
            isLabelHidden
            value={row.sealNumber}
            onChange={(value) => setRowField(row.id, 'sealNumber', value)}
            placeholder="Tuỳ chọn"
            status={statuses.sealNumber}
            statusVariant="tooltip"
            width={130}
          />
        ),
        carrier: (
          <Selector
            label={`Nhà vận chuyển dòng ${line}`}
            isLabelHidden
            hasSearch
            hasClear
            placeholder={row.carrierName || 'Chọn nhà cung cấp'}
            value={row.carrierCustomerId || null}
            onChange={(value) =>
              setRowField(row.id, 'carrierCustomerId', value ?? '')
            }
            options={carrierOptions}
            status={statuses.carrierCustomerId}
            statusVariant="tooltip"
            width={220}
          />
        ),
        packingDate: (
          <DateInput
            label={`Ngày đóng dòng ${line}`}
            isLabelHidden
            value={isoDate(row.packingDate)}
            onChange={(value) =>
              setRowField(row.id, 'packingDate', value ?? '')
            }
            format={formatDateInputValue}
            hasClear
            status={statuses.packingDate}
            statusVariant="tooltip"
            width={180}
          />
        ),
        vgm: (
          <MetaPill
            label={
              vgmState.state === 'declared'
                ? `${WEIGHT_FORMATTER.format(vgmState.vgm)} kg`
                : vgmState.state === 'partial'
                  ? `Thiếu ${vgmState.missing} khối lượng`
                  : 'Chưa khai'
            }
            tone={
              vgmState.state === 'declared'
                ? 'success'
                : vgmState.state === 'partial'
                  ? 'warning'
                  : 'neutral'
            }
            hasDot={vgmState.state === 'declared'}
            size="sm"
          />
        ),
        actions: (
          <HStack gap={1} vAlign="center" wrap="nowrap">
            <Button
              label="Chi tiết"
              type="button"
              size="sm"
              variant={isSelected ? 'primary' : 'secondary'}
              icon={<Icon icon={PanelBottomOpen} size="sm" />}
              onClick={() => setSelectedId(isSelected ? null : row.id)}
            />
            <IconButton
              label={`Xoá dòng ${line}`}
              type="button"
              size="sm"
              variant="ghost"
              icon={<Icon icon={Trash2} size="sm" />}
              onClick={() => removeRow(row.id)}
            />
          </HStack>
        ),
      },
    };
  });

  const detailStatuses = selected ? statusesFor(selected.id) : {};
  /** @type {import('./shipment-vgm-fields.jsx').VgmFieldProps['setField']} */
  const setSelectedField = (field, value) => {
    if (selected) setRowField(selected.id, field, /** @type {never} */ (value));
  };

  return (
    <MetaFormDrawer
      onClose={onClose}
      icon={ListPlus}
      title="Thêm danh sách container"
      width={1480}
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Text size="sm" weight="bold" color="accent" type="code">
            {shipmentCode}
          </Text>
          <MetaPill label={`${rows.length} dòng`} tone="neutral" />
          <MetaPill
            label={`${declaredCount}/${rows.length} đã khai VGM`}
            tone={
              rows.length > 0 && declaredCount === rows.length
                ? 'success'
                : 'neutral'
            }
            hasDot={rows.length > 0 && declaredCount === rows.length}
          />
          {errorRowCount > 0 ? (
            <MetaPill
              label={`${errorRowCount} dòng cần sửa`}
              tone="danger"
              hasDot
            />
          ) : null}
        </HStack>
      }
      draft={rows}
      submitLabel={`Lưu ${rows.length} container`}
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      isSubmitDisabled={rows.length === 0}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={1}
        title="Nhập từ Excel"
        action={
          <Button
            label="Tải tệp mẫu Excel"
            type="button"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Download} size="sm" />}
            onClick={downloadTemplate}
          />
        }
      >
        <FileInput
          label="Tệp danh sách container"
          isLabelHidden
          placeholder="Kéo thả tệp Excel vào đây, hoặc bấm để chọn tệp (.xlsx, .xls)"
          value={file}
          onChange={(next) => {
            void importFile(Array.isArray(next) ? (next[0] ?? null) : next);
          }}
          accept=".xlsx,.xls"
          maxSize={5 * 1024 * 1024}
          mode="dropzone"
          status={
            fileError
              ? { type: 'error', message: fileError }
              : file && rows.length > 0
                ? {
                    type: 'success',
                    message: `Đã đọc ${rows.length} container từ tệp.`,
                  }
                : undefined
          }
          statusVariant="detached"
          width="100%"
        />
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={2}
        title="Nhập nhanh"
        meta="Điền một giá trị cho mọi dòng"
      >
        <HStack gap={3} vAlign="end" wrap="wrap">
          <Selector
            label="Nhà vận chuyển"
            hasSearch
            hasClear
            placeholder="Chọn nhà cung cấp"
            value={quickCarrier || null}
            onChange={(value) => setQuickCarrier(value ?? '')}
            options={carrierOptions}
            width={280}
          />
          <Button
            label="Áp dụng"
            type="button"
            variant="secondary"
            size="lg"
            icon={<Icon icon={CopyCheck} size="sm" />}
            isDisabled={!quickCarrier || rows.length === 0}
            onClick={() => applyToAll('carrierCustomerId', quickCarrier)}
          />
          <DateInput
            label="Ngày đóng hàng"
            value={isoDate(quickDate)}
            onChange={(value) => setQuickDate(value ?? '')}
            format={formatDateInputValue}
            hasClear
          />
          <Button
            label="Áp dụng"
            type="button"
            variant="secondary"
            size="lg"
            icon={<Icon icon={CopyCheck} size="sm" />}
            isDisabled={!quickDate || rows.length === 0}
            onClick={() => applyToAll('packingDate', quickDate)}
          />
        </HStack>
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={3}
        title={`Danh sách container (${rows.length})`}
        action={
          <Button
            label="Thêm dòng"
            type="button"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Plus} size="sm" />}
            onClick={addRow}
          />
        }
      >
        {issues.length > 0 ? (
          <Banner
            status="error"
            title={`${issues.length} lỗi cần sửa trước khi lưu`}
            container="card"
            collapsible={false}
          >
            <VStack gap={1}>
              {issues.slice(0, 8).map((issue) => (
                <Text key={`${issue.rowId}-${issue.field}`} size="sm">
                  {issue.line
                    ? `Dòng ${issue.line}${issue.field ? ` · ${columnLabel[issue.field === 'carrierCustomerId' ? 'carrierName' : issue.field] ?? issue.field}` : ''}: `
                    : ''}
                  {issue.message}
                </Text>
              ))}
              {issues.length > 8 ? (
                <Text size="sm" color="secondary">
                  … và {issues.length - 8} lỗi khác.
                </Text>
              ) : null}
            </VStack>
          </Banner>
        ) : null}
        <MetaCompactTable
          columns={[
            { key: 'no', header: '#', align: 'center' },
            { key: 'containerNumber', header: 'Số container *' },
            { key: 'containerType', header: 'Loại *' },
            { key: 'sealNumber', header: 'Số seal' },
            { key: 'carrier', header: 'Nhà vận chuyển' },
            { key: 'packingDate', header: 'Ngày đóng' },
            { key: 'vgm', header: 'VGM' },
            { key: 'actions', header: '' },
          ]}
          rows={tableRows}
          emptyLabel="Chưa có dòng. Chọn tệp Excel hoặc bấm “Thêm dòng”."
        />
        <Text size="sm" color="secondary">
          Số container không được trùng với {existingNumbers.length} container
          đã có. Bấm “Chi tiết” để nhập khối lượng VGM, giờ đóng hàng và ghi chú
          của từng dòng.
        </Text>
      </MetaFormSection>

      {selected ? (
        <MetaFormSection
          isBoxed
          isTitleUppercase={false}
          index={4}
          title={`Chi tiết dòng ${selectedLine}${selected.containerNumber ? ` · ${selected.containerNumber}` : ''}`}
          action={
            <Button
              label="Đóng chi tiết"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
            />
          }
        >
          <HStack gap={6} vAlign="start" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={3} hAlign="stretch">
                <Text weight="semibold">Khai VGM</Text>
                <ShipmentVgmDeclarationFields
                  values={selected}
                  setField={setSelectedField}
                  fieldStatuses={detailStatuses}
                  customers={carriers}
                  hasPackingFields={false}
                />
              </VStack>
            </StackItem>
            <StackItem size="fill">
              <VStack gap={3} hAlign="stretch">
                <Text weight="semibold">Thời gian & ghi chú</Text>
                <ShipmentVgmAdditionalFields
                  values={selected}
                  setField={setSelectedField}
                  fieldStatuses={detailStatuses}
                />
              </VStack>
            </StackItem>
          </HStack>
        </MetaFormSection>
      ) : null}
    </MetaFormDrawer>
  );
}
