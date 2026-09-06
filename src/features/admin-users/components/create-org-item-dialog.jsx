'use client';

import { TextInput } from '@astryxdesign/core/TextInput';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

/**
 * Generic "add a new X" dialog reused by all four org-directory Selectors in
 * `UserOrgFields` (Công ty/Chi nhánh/Phòng ban/Chức vụ). One shape covers all
 * four because every backend create endpoint behind them
 * (`CreateCompanyCommand`/`CreateBranchCommand`/`CreateDepartmentCommand`/
 * `CreatePositionCommand`) takes only a `Name` — any parent id (company for a
 * branch, branch for a department) is already known from the Selector the
 * person opened this from, not something they re-enter here.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   title: string,
 *   label: string,
 *   isSubmitting: boolean,
 *   onSubmit: (name: string) => Promise<{ success: true, id?: string } | { success: false, message: string }>,
 *   onCreated: (id: string) => void,
 * }} props
 */
export function CreateOrgItemDialog({
  isOpen,
  onOpenChange,
  title,
  label,
  isSubmitting,
  onSubmit,
  onCreated,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      setName('');
      setError('');
    }
    onOpenChange(nextIsOpen);
  }

  async function handleSubmit() {
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên');
      return;
    }

    const result = await onSubmit(name.trim());

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.id) onCreated(result.id);
    handleOpenChange(false);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      submitLabel="Thêm"
      width={400}
      draft={name}
      isSubmitting={isSubmitting}
      submitError={error}
      onSubmit={handleSubmit}
    >
      <TextInput label={label} value={name} onChange={setName} isRequired />
    </FormDialog>
  );
}
