'use client';

import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { downloadPublicDataUrl } from '../api/backups.js';

/** @param {{isOpen: boolean, onOpenChange: (isOpen: boolean) => void}} props */
export function ExportPublicDataDialog({ isOpen, onOpenChange }) {
  const [section, setSection] = useState('');

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) setSection('');
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  function handleSubmit(event) {
    event.preventDefault();
    if (section !== 'fuel' && section !== 'ports') return;
    const url = downloadPublicDataUrl(section);
    handleOpenChange(false);
    window.location.assign(url);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Xuất dữ liệu public"
      submitLabel="Xuất dữ liệu"
      width={480}
      draft={section}
      isReady={section !== ''}
      onSubmit={handleSubmit}
    >
      <VStack gap={3} hAlign="stretch">
        <Text color="secondary">
          Chọn một nhóm dữ liệu để tải file JSON. Sau đó có thể nhập file này ở môi trường production.
        </Text>
        <RadioList label="Mục cần xuất" value={section} onChange={setSection} isRequired>
          <RadioListItem value="fuel" label="Xăng dầu" description="Toàn bộ kỳ giá Việt Nam và Thái Lan" />
          <RadioListItem value="ports" label="Cảng nước" description="Quốc gia và cảng đến" />
        </RadioList>
      </VStack>
    </FormDialog>
  );
}
