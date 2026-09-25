'use client';

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
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { BadgeCheck } from 'lucide-react';
import { useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import {
  MetaDrawerHeader,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { ThemeProvider } from '@/shared/components/theme-provider.jsx';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  // Muted canvas under white section cards, like the other Meta drawers.
  canvas: {
    backgroundColor: 'var(--color-background-muted)',
  },
  // Roomy Meta form controls (read by the Meta theme's field overrides).
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
  },
});

/**
 * Meta drawer shell for the customer / supplier forms (full create / edit
 * and the quick-create ones opened from contract / shipment drawers):
 * `MetaDrawerHeader`, muted canvas, footer Huỷ bỏ / submit. The submit
 * drawer is portaled to `document.body` (the lab `Drawer` renders in place,
 * so a quick-create opened inside the contract / shipment drawer would
 * otherwise nest its `<form>` in theirs), and the submit handler stops
 * propagation so it never submits that parent form — both as `FormDialog`.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title: string,
 *   icon: import('lucide-react').LucideIcon,
 *   code?: string,
 *   width?: number,
 *   submitLabel: string,
 *   submitError?: string | null,
 *   isSubmitting: boolean,
 *   onSubmit: (event: import('react').FormEvent<HTMLFormElement>) => unknown,
 *   children: import('react').ReactNode,
 * }} props
 */
export function PartyFormDrawer({
  isOpen,
  onClose,
  title,
  icon,
  code,
  width = 960,
  submitLabel,
  submitError,
  isSubmitting,
  onSubmit,
  children,
}) {
  const formId = useId();
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!isOpen || !isClient) return null;

  return createPortal(
    <ThemeProvider>
      <MetaThemeProvider>
        <Drawer
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
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
                  code={code}
                  onClose={onClose}
                />
              </LayoutHeader>
            }
            content={
              <LayoutContent padding={6} xstyle={styles.canvas}>
                <form
                  id={formId}
                  onSubmit={(event) => {
                    event.stopPropagation();
                    onSubmit(event);
                  }}
                  {...stylex.props(styles.fields)}
                >
                  <VStack gap={5} hAlign="stretch">
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
                <HStack hAlign="end" gap={2}>
                  <Button
                    label="Huỷ bỏ"
                    variant="secondary"
                    size="lg"
                    isDisabled={isSubmitting}
                    onClick={onClose}
                  />
                  <Button
                    label={submitLabel}
                    type="submit"
                    form={formId}
                    variant="primary"
                    size="lg"
                    icon={<Icon icon={BadgeCheck} size="sm" />}
                    isLoading={isSubmitting}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </Drawer>
      </MetaThemeProvider>
    </ThemeProvider>,
    document.body,
  );
}
