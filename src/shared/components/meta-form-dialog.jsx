'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { CommonDialog } from './common-dialog.jsx';
import { MetaDrawerHeader, MetaThemeProvider } from './custom/meta/index.js';

/**
 * Meta form dialog (next to `FormDialog`: it owns a native `<form>`,
 * which golden rule #15 keeps out of `custom/`) — the drawer language of `ShipmentCostLineDrawer` /
 * `ShipmentEditDrawer` in a centered dialog, for short edits (a journey
 * milestone, empty-container returns): `MetaDrawerHeader` (icon tile,
 * title, pill line, close), the body on the muted canvas (children are
 * usually `MetaFormSection isBoxed` cards), and a footer with the
 * unsaved-changes hint, "Huỷ bỏ" and a large primary action with an icon.
 * Closing with changes (draft differs from the one it opened with) asks
 * first. Re-applies Meta itself since the dialog portals out.
 *
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   icon: import('lucide-react').LucideIcon,
 *   title: string,
 *   meta?: import('react').ReactNode,
 *   width?: number,
 *   draft: unknown,
 *   submitLabel: string,
 *   submitIcon?: import('lucide-react').LucideIcon,
 *   isSubmitting?: boolean,
 *   submitError?: string,
 *   onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => unknown,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaFormDialog({
  isOpen,
  onOpenChange,
  icon,
  title,
  meta,
  width = 560,
  draft,
  submitLabel,
  submitIcon,
  isSubmitting = false,
  submitError = '',
  onSubmit,
  children,
}) {
  const formId = useId();
  const fingerprint = JSON.stringify(draft);
  const [baseline] = useState(fingerprint);
  const isDirty = baseline !== fingerprint;
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  function requestClose() {
    if (isSubmitting) return;
    if (isDirty) setIsConfirmingDiscard(true);
    else onOpenChange(false);
  }

  return (
    <MetaThemeProvider>
      <CommonDialog
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        width={width}
      >
        <form
          id={formId}
          onSubmit={(event) => {
            event.stopPropagation();
            return onSubmit(event);
          }}
          noValidate
          {...stylex.props(styles.form)}
        >
          <Layout
            defaultHasDividers
            header={
              <LayoutHeader padding={4}>
                <MetaDrawerHeader
                  icon={icon}
                  title={title}
                  meta={meta}
                  onClose={requestClose}
                />
              </LayoutHeader>
            }
            content={
              <LayoutContent padding={5} xstyle={styles.canvas}>
                <VStack gap={4} hAlign="stretch">
                  {submitError ? (
                    <Banner
                      status="error"
                      title={submitError}
                      container="card"
                    />
                  ) : null}
                  {children}
                </VStack>
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
                    {isDirty ? <HStack as="span" xstyle={styles.dot} /> : null}
                    <Text size="sm" color="secondary">
                      {isSubmitting
                        ? 'Đang lưu…'
                        : isDirty
                          ? 'Có thay đổi chưa lưu'
                          : 'Chưa có thay đổi'}
                    </Text>
                  </HStack>
                  <HStack gap={2} vAlign="center" wrap="nowrap">
                    <Button
                      label="Huỷ bỏ"
                      type="button"
                      variant="secondary"
                      size="lg"
                      isDisabled={isSubmitting}
                      onClick={requestClose}
                    />
                    <Button
                      label={submitLabel}
                      type="submit"
                      form={formId}
                      variant="primary"
                      size="lg"
                      icon={
                        submitIcon ? (
                          <Icon icon={submitIcon} size="sm" />
                        ) : undefined
                      }
                      isLoading={isSubmitting}
                    />
                  </HStack>
                </HStack>
              </LayoutFooter>
            }
          />
        </form>
      </CommonDialog>

      <AlertDialog
        isOpen={isConfirmingDiscard}
        onOpenChange={setIsConfirmingDiscard}
        title="Bỏ thay đổi chưa lưu?"
        description="Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu."
        actionLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục nhập"
        onAction={() => {
          setIsConfirmingDiscard(false);
          onOpenChange(false);
        }}
      />
    </MetaThemeProvider>
  );
}

const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: 'inherit',
    minHeight: 0,
  },
  // Same muted canvas as the Meta drawers.
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
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
