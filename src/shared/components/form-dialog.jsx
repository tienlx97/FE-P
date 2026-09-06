'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { CommonDialog } from './common-dialog.jsx';
import { ThemeProvider } from './theme-provider.jsx';

const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: 'inherit',
    minHeight: 0,
  },
});

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Shared frame for operational forms. Portaling the whole frame keeps quick
 * creates out of their parent's native form; stopPropagation also isolates
 * submit events in the React tree. Each opening gets a fresh draft baseline.
 * @param {{
 * isOpen: boolean, onOpenChange: (open: boolean) => void,
 * title: string, subtitle?: string, submitLabel: string,
 * onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => unknown | Promise<unknown>,
 * children: import('react').ReactNode, draft: unknown,
 * isSubmitting?: boolean, isReady?: boolean, submitError?: string,
 * fieldStatuses?: Record<string, { type: string, message: string } | undefined>,
 * successMessage?: string, variant?: 'fullscreen', width?: number,
 * navigation?: import('react').ReactNode,
 * onValidation?: () => void,
 * isReadOnly?: boolean, onEdit?: () => void,
 * }} props
 */
export function FormDialog(props) {
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!props.isOpen || !isClient) return null;
  return createPortal(
    <ThemeProvider>
      <FormDialogSession {...props} />
    </ThemeProvider>,
    document.body,
  );
}

/** @param {Parameters<typeof FormDialog>[0]} props */
function FormDialogSession({
  onOpenChange,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  children,
  draft,
  isSubmitting = false,
  isReady = true,
  submitError = '',
  fieldStatuses = {},
  successMessage = '',
  variant,
  width,
  navigation,
  onValidation,
  isReadOnly = false,
  onEdit,
}) {
  const formId = useId();
  const fingerprint = JSON.stringify(draft);
  const [baseline, setBaseline] = useState(fingerprint);
  const [wasReadOnly, setWasReadOnly] = useState(isReadOnly);
  const [wasReady, setWasReady] = useState(isReady);
  const [confirmedSuccess, setConfirmedSuccess] = useState(successMessage);
  if (
    wasReadOnly !== isReadOnly ||
    wasReady !== isReady ||
    confirmedSuccess !== successMessage
  ) {
    setWasReadOnly(isReadOnly);
    setWasReady(isReady);
    setConfirmedSuccess(successMessage);
    setBaseline(fingerprint);
  }
  const isDirty = !isReadOnly && isReady && baseline !== fingerprint;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [unexpectedError, setUnexpectedError] = useState('');
  const isBusy = isSubmitting || isSaving;
  const errors = Object.values(fieldStatuses).filter(
    (status) => status?.type === 'error',
  );
  const error =
    submitError ||
    unexpectedError ||
    (errors.length
      ? 'Vui lòng kiểm tra các trường được đánh dấu trước khi lưu.'
      : '');

  function requestClose() {
    if (isBusy || savingRef.current) return;
    if (isDirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function submit(event) {
    event.preventDefault();
    event.stopPropagation();
    if (isReadOnly || !isReady || isBusy || savingRef.current) return;
    const formElement = event.currentTarget;
    savingRef.current = true;
    setIsSaving(true);
    setUnexpectedError('');
    try {
      onValidation?.();
      await onSubmit(event);
      requestAnimationFrame(() => {
        if (!formElement.isConnected) return;
        const invalid = formElement.querySelector('[aria-invalid="true"]');
        if (invalid instanceof HTMLElement) {
          invalid.scrollIntoView({ block: 'center' });
          invalid.focus({ preventScroll: true });
        } else if (formElement.querySelector('.astryx-banner')) {
          formElement
            .querySelector('.astryx-banner')
            ?.scrollIntoView({ block: 'start' });
        }
      });
    } catch {
      setUnexpectedError(
        'Không thể lưu. Dữ liệu đang nhập vẫn được giữ lại; vui lòng thử lại.',
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <>
      <CommonDialog
        isOpen
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        variant={variant}
        width={width}
      >
        <form
          id={formId}
          onSubmit={submit}
          noValidate
          {...stylex.props(styles.form)}
        >
          <Layout
            header={
              <VStack hAlign="stretch" gap={2}>
                <DialogHeader
                  title={title}
                  subtitle={subtitle}
                  onOpenChange={requestClose}
                />
                {navigation}
              </VStack>
            }
            content={
              <LayoutContent padding={4}>
                <VStack gap={4} hAlign="stretch">
                  {error ? (
                    <Banner status="error" title={error} container="card" />
                  ) : null}
                  {successMessage ? (
                    <Banner
                      status="success"
                      title={successMessage}
                      container="card"
                    />
                  ) : null}
                  {children}
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack hAlign="between" gap={2} wrap="wrap">
                  <Text color="secondary">
                    {isBusy
                      ? 'Đang lưu…'
                      : isDirty
                        ? 'Có thay đổi chưa lưu'
                        : ''}
                  </Text>
                  <HStack gap={2}>
                    <Button
                      label={isReadOnly ? 'Đóng' : 'Hủy'}
                      type="button"
                      variant="secondary"
                      isDisabled={isBusy}
                      onClick={requestClose}
                    />
                    {isReadOnly ? (
                      onEdit ? (
                        <Button
                          key="edit"
                          label="Sửa"
                          type="button"
                          variant="primary"
                          onClick={(event) => {
                            event.preventDefault();
                            onEdit();
                          }}
                        />
                      ) : null
                    ) : (
                      <Button
                        key="save"
                        label={submitLabel}
                        type="submit"
                        form={formId}
                        variant="primary"
                        isLoading={isBusy}
                        isDisabled={!isReady}
                      />
                    )}
                  </HStack>
                </HStack>
              </LayoutFooter>
            }
          />
        </form>
      </CommonDialog>
      <AlertDialog
        isOpen={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Bỏ thay đổi chưa lưu?"
        description="Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu."
        cancelLabel="Tiếp tục nhập"
        actionLabel="Bỏ thay đổi"
        onAction={() => {
          setConfirmDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
