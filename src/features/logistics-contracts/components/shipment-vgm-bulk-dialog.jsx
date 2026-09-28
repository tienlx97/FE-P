'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { FileInput } from '@astryxdesign/core/FileInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { MetaCompactTable } from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  emptyBulkContainerRow,
  parseBulkContainerRows,
  validateBulkContainerRows,
} from '../config/bulk-containers.js';
import { shipmentContainerTypeOptions } from '../config/shipment-container-types.js';
import { useBulkCreateShipmentVgmsMutation } from '../hooks/use-shipment-vgms-query.js';

const HEADERS = ['Số container', 'Loại cont', 'Số seal', 'Ngày đóng'];

/**
 * @param {{contractId: string, shipmentId: string, existingNumbers: string[], mode: 'table' | 'excel', onClose: () => void}} props
 */
export function ShipmentVgmBulkDialog({ contractId, shipmentId, existingNumbers, mode, onClose }) {
  const toast = useAppToast();
  const mutation = useBulkCreateShipmentVgmsMutation(contractId, shipmentId);
  const [rows, setRows] = useState(/** @type {import('../types/index.js').BulkContainerRow[]} */ (
    mode === 'table' ? [emptyBulkContainerRow()] : []
  ));
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [error, setError] = useState('');
  const [issues, setIssues] = useState(/** @type {string[]} */ ([]));

  /** @param {string} id @param {keyof import('../types/index.js').BulkContainerRow} field @param {string} value */
  function changeRow(id, field, value) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
    setIssues([]);
  }

  async function downloadTemplate() {
    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([HEADERS]);
    sheet['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(book, sheet, 'Containers');
    XLSX.writeFile(book, 'mau-danh-sach-container.xlsx');
  }

  /** @param {File | null} selected */
  async function importFile(selected) {
    setFile(selected);
    setError('');
    setIssues([]);
    if (!selected) return;
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await selected.arrayBuffer(), { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Tệp Excel không có sheet dữ liệu.');
      const records = /** @type {Record<string, unknown>[]} */ (
        XLSX.utils.sheet_to_json(sheet, { defval: '' })
      );
      const parsed = parseBulkContainerRows(records);
      if (parsed.length === 0) throw new Error('Không tìm thấy dòng container. Kiểm tra các cột trong tệp mẫu.');
      setRows(parsed);
      if (parsed.length > 100) setIssues(['Tệp có hơn 100 dòng. Chia thành nhiều lần nhập.']);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đọc tệp Excel.');
    }
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function save(event) {
    event.preventDefault();
    setError('');
    const validation = validateBulkContainerRows(rows, existingNumbers);
    setIssues(validation);
    if (validation.length) return;
    const result = await mutation.mutateAsync(rows);
    if (!result.success) {
      setError(result.message);
      return;
    }
    toast({ body: `Đã thêm ${result.vgms.length} container.` });
    onClose();
  }

  return (
    <FormDialog
      isOpen
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Thêm danh sách container"
      subtitle="Nhập trực tiếp hoặc tải Excel; kiểm tra bảng trước khi lưu. VGM có thể khai sau."
      submitLabel={`Lưu ${rows.length} cont`}
      width={1100}
      draft={rows}
      isSubmitting={mutation.isPending}
      submitError={error}
      onSubmit={save}
    >
      <VStack gap={3} hAlign="stretch">
        <HStack gap={2} wrap="wrap">
          <Button label="Tải tệp mẫu Excel" type="button" variant="secondary" icon={<Icon icon={Download} size="sm" />} onClick={downloadTemplate} />
          <Button label="Thêm dòng" type="button" variant="secondary" icon={<Icon icon={Plus} size="sm" />} onClick={() => setRows((current) => [...current, emptyBulkContainerRow(crypto.randomUUID())])} />
        </HStack>
        <FileInput
          label="Nhập danh sách từ Excel"
          description="Cột: Số container, Loại cont, Số seal, Ngày đóng. Chấp nhận .xlsx/.xls, tối đa 5 MB."
          value={file}
          onChange={(next) => { void importFile(Array.isArray(next) ? next[0] ?? null : next); }}
          accept=".xlsx,.xls"
          maxSize={5 * 1024 * 1024}
          mode="dropzone"
        />
        {issues.length > 0 ? (
          <Banner status="error" title={`${issues.length} lỗi cần sửa`} container="card">
            <VStack gap={1}>{issues.slice(0, 10).map((issue) => <Text key={issue} size="sm">{issue}</Text>)}</VStack>
          </Banner>
        ) : null}
        <Text size="sm" color="secondary">{rows.length} dòng · số container không được trùng với danh sách hiện có. Trên điện thoại, vuốt ngang bảng để xem các cột còn lại.</Text>
        <MetaCompactTable
          columns={[
            { key: 'no', header: '#' },
            { key: 'number', header: 'Số container' },
            { key: 'type', header: 'Loại cont' },
            { key: 'seal', header: 'Số seal' },
            { key: 'date', header: 'Ngày đóng (yyyy-mm-dd)' },
            { key: 'actions', header: '' },
          ]}
          rows={rows.map((row, index) => ({
            id: row.id,
            cells: {
              no: <Text type="code">{index + 1}</Text>,
              number: <TextInput label={`Số container dòng ${index + 1}`} isLabelHidden value={row.containerNumber} onChange={(value) => changeRow(row.id, 'containerNumber', value)} placeholder="TCLU1234567" width="100%" />,
              type: <Selector label={`Loại cont dòng ${index + 1}`} isLabelHidden hasClear value={row.containerType || null} onChange={(value) => changeRow(row.id, 'containerType', value ?? '')} options={shipmentContainerTypeOptions} width="100%" />,
              seal: <TextInput label={`Số seal dòng ${index + 1}`} isLabelHidden value={row.sealNumber} onChange={(value) => changeRow(row.id, 'sealNumber', value)} placeholder="Tuỳ chọn" width="100%" />,
              date: <TextInput label={`Ngày đóng dòng ${index + 1}`} isLabelHidden value={row.packingDate} onChange={(value) => changeRow(row.id, 'packingDate', value)} placeholder="yyyy-mm-dd" width="100%" />,
              actions: <Button label={`Xoá dòng ${index + 1}`} type="button" variant="ghost" icon={<Icon icon={Trash2} size="sm" />} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} />,
            },
          }))}
          emptyLabel="Chưa có dòng. Chọn Excel hoặc thêm dòng để bắt đầu."
        />
      </VStack>
    </FormDialog>
  );
}
