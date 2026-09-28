'use client';

import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { FileDown } from 'lucide-react';
import { useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';

import { exportPublicData } from '../api/backups.js';

/** @param {{onOpenChange: (isOpen: boolean) => void}} props */
export function ExportPublicDataDrawer({ onOpenChange }) {
  const [section, setSection] = useState('');
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      setSection('');
      setError('');
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    if (section !== 'fuel-vn' && section !== 'fuel-th' && section !== 'ports')
      return;
    setError('');
    setIsExporting(true);
    try {
      const result = await exportPublicData(section);
      if (!result.success) {
        setError(result.message);
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      handleOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <MetaFormDrawer
      onClose={() => handleOpenChange(false)}
      icon={FileDown}
      title="Xuất dữ liệu public"
      submitLabel="Xuất dữ liệu"
      width={600}
      draft=""
      showDirtyHint={false}
      isSubmitDisabled={section === ''}
      isSubmitting={isExporting}
      submitError={error}
      onSubmit={handleSubmit}
    >
      <MetaFormSection title="Nhóm dữ liệu" isTitleUppercase={false} isBoxed>
        <VStack gap={3} hAlign="stretch">
          <Text color="secondary">
            Chọn một nhóm dữ liệu để tải file JSON. Sau đó có thể nhập file này
            ở môi trường production.
          </Text>
          <RadioList
            label="Mục cần xuất"
            value={section}
            onChange={(value) => {
              setSection(value);
              setError('');
            }}
            isRequired
          >
            <RadioListItem
              value="fuel-vn"
              label="Xăng dầu Việt Nam"
              description="Toàn bộ kỳ giá Việt Nam"
            />
            <RadioListItem
              value="fuel-th"
              label="Xăng dầu Thái Lan"
              description="Toàn bộ kỳ giá Thái Lan"
            />
            <RadioListItem
              value="ports"
              label="Cảng nước"
              description="Quốc gia và cảng đến"
            />
          </RadioList>
        </VStack>
      </MetaFormSection>
    </MetaFormDrawer>
  );
}
