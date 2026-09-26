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
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { MetaDrawerHeader, MetaThemeProvider } from './custom/meta/index.js';

/**
 * Meta form drawer — `MetaFormDialog`'s frame as an end-side drawer, for
 * edits with many rows (container dates, transshipment legs):
 * `MetaDrawerHeader`, the body on the muted canvas (children are usually
 * `MetaFormSection isBoxed` cards), a footer with the unsaved-changes
 * hint, "Huỷ bỏ" and a large primary action. Closing with changes (draft
 * differs from the one it opened with) asks first. Rendered open; the
 * caller mounts / unmounts it. Re-applies Meta itself.
 *
 * @param {{
 *   onClose: () => void,
 *   icon: import('lucide-react').LucideIcon,
 *   title: string,
 *   meta?: import('react').ReactNode,
 *   width?: number,
 *   draft: unknown,
 *   submitLabel: string,
 *   submitIcon?: import('lucide-react').LucideIcon,
 *   isSubmitting?: boolean,
 *   isSubmitDisabled?: boolean,
 *   submitError?: string,
 *   onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => unknown,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaFormDrawer({
  onClose,
  icon,
  title,
  meta,
  width = 960,
  draft,
  submitLabel,
  submitIcon,
  isSubmitting = false,
  isSubmitDisabled = false,
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
    else onClose();
  }

  return (
    <MetaThemeProvider>
      <Drawer
        isOpen
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        side="end"
        width={width}
        isFullWidthOnMobile
        label={title}
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
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
              <form
                id={formId}
                onSubmit={(event) => {
                  event.stopPropagation();
                  return onSubmit(event);
                }}
                noValidate
                {...stylex.props(styles.fields)}
              >
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
              </form>
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
                      submitIcon ? <Icon icon={submitIcon} size="sm" /> : undefined
                    }
                    isLoading={isSubmitting}
                    isDisabled={isSubmitDisabled}
                  />
                </HStack>
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>

      <AlertDialog
        isOpen={isConfirmingDiscard}
        onOpenChange={setIsConfirmingDiscard}
        title="Bỏ thay đổi chưa lưu?"
        description="Những thay đổi của bạn sẽ mất nếu đóng lại."
        actionLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục nhập"
        onAction={() => {
          setIsConfirmingDiscard(false);
          onClose();
        }}
      />
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
  // Same muted canvas as the Meta drawers.
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
