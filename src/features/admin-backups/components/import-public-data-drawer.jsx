'use client';

import { FileInput } from '@astryxdesign/core/FileInput';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { FileUp } from 'lucide-react';
import { useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';

import { useImportPublicDataMutation } from '../hooks/use-import-public-data-mutation.js';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** @param {{onOpenChange: (isOpen: boolean) => void}} props */
export function ImportPublicDataDrawer({ onOpenChange }) {
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const mutation = useImportPublicDataMutation();

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      setFile(null);
      setError('');
      setSuccessMessage('');
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (
      !file ||
      !file.name.toLowerCase().endsWith('.json') ||
      file.size > MAX_FILE_BYTES
    ) {
      setError('Chọn file .json dữ liệu public, tối đa 20 MB.');
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (
        data.version !== 1 ||
        !Array.isArray(data.countries) ||
        !Array.isArray(data.ports) ||
        !Array.isArray(data.fuelPricePeriods)
      ) {
        setError('File không đúng định dạng dữ liệu public.');
        return;
      }
    } catch {
      setError('File JSON không hợp lệ.');
      return;
    }
    const result = await mutation.mutateAsync(file);
    if (!result.success) {
      setError(result.message);
      return;
    }
    const { countriesAdded, portsAdded, fuelPeriodsAdded } = result.summary;
    setSuccessMessage(
      `Đã nhập ${countriesAdded} quốc gia, ${portsAdded} cảng, ${fuelPeriodsAdded} kỳ giá xăng dầu.`,
    );
  }

  return (
    <MetaFormDrawer
      onClose={() => handleOpenChange(false)}
      icon={FileUp}
      title="Nhập dữ liệu public"
      submitLabel="Nhập dữ liệu"
      width={600}
      draft=""
      showDirtyHint={false}
      isSubmitting={mutation.isPending}
      isSubmitDisabled={!!successMessage}
      submitError={error}
      onSubmit={handleSubmit}
    >
      {successMessage ? <Text color="secondary">{successMessage}</Text> : null}
      {!successMessage ? (
        <MetaFormSection
          title="Chọn dữ liệu public"
          isTitleUppercase={false}
          isBoxed
        >
          <VStack gap={3} hAlign="stretch">
            <Text color="secondary">
              Nhập file JSON đã xuất từ môi trường dev. Hệ thống thêm quốc gia,
              cảng đến và lịch sử giá xăng dầu còn thiếu; dữ liệu hiện có được
              giữ nguyên.
            </Text>
            <FileInput
              label="Dữ liệu public (.json)"
              value={file}
              onChange={(files) =>
                setFile(Array.isArray(files) ? (files[0] ?? null) : files)
              }
              accept=".json,application/json"
              isRequired
            />
          </VStack>
        </MetaFormSection>
      ) : null}
    </MetaFormDrawer>
  );
}
