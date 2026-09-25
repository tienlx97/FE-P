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
import { BadgeCheck, Building2 } from 'lucide-react';
import { useId } from 'react';

import {
  MetaDrawerHeader,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { useCustomerForm } from '../hooks/use-customer-form.js';
import { PartyFormFields } from './party-form-fields.jsx';

// Same width as the Commission drawer (Figma 104:5399).
const DRAWER_WIDTH = 960;

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
 * Meta create / edit drawer for a customer — replaces the old
 * `CustomerFormDialog`. Same `useCustomerForm` (validation, create /
 * update calls); the form is laid out as boxed section cards
 * (`PartyFormFields layout="sections"`) on the drawers' muted canvas.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   customer?: import('../types/index.js').Customer | null,
 *   onSuccess?: (customer: import('../types/index.js').Customer) => void,
 * }} props
 */
export function CustomerFormDrawer({
  isOpen,
  onOpenChange,
  customer = null,
  onSuccess,
}) {
  const formId = useId();
  const form = useCustomerForm({
    customer,
    onSuccess: (saved) => {
      onOpenChange(false);
      onSuccess?.(saved);
    },
  });

  function close() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <MetaThemeProvider>
      <Drawer
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        side="end"
        width={DRAWER_WIDTH}
        isFullWidthOnMobile
        label={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={Building2}
                title={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
                code={customer?.profile?.code || undefined}
                onClose={close}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={6} xstyle={styles.canvas}>
              <form
                id={formId}
                onSubmit={form.handleSubmit}
                {...stylex.props(styles.fields)}
              >
                <VStack gap={5} hAlign="stretch">
                  {form.submitError ? (
                    <Banner
                      status="error"
                      title={form.submitError}
                      container="card"
                    />
                  ) : null}
                  <PartyFormFields
                    kind="customer"
                    form={form}
                    layout="sections"
                  />
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
                  isDisabled={form.isSubmitting}
                  onClick={close}
                />
                <Button
                  label={customer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                  type="submit"
                  form={formId}
                  variant="primary"
                  size="lg"
                  icon={<Icon icon={BadgeCheck} size="sm" />}
                  isLoading={form.isSubmitting}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>
    </MetaThemeProvider>
  );
}
