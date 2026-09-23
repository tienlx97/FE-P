'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
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
import { ClipboardList, Save } from 'lucide-react';
import { useId, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaDrawerHeader,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { useContractPrivateInfoForm } from '../hooks/use-contract-private-info-form.js';
import { ContractPrivateInfoFields } from './contract-private-info-fields.jsx';

// Same width as the contract edit drawer.
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
  // Same roomy form controls as the contract edit drawer (read by the
  // Meta theme's field overrides). StyleX compiles custom-property keys;
  // its lint rule just doesn't know them.
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
  },
  hint: {
    minWidth: 0,
  },
});

/**
 * Meta edit drawer for a contract's BOQ (private info), opened from the
 * detail page's "BOQ" tab. Same shell as the contract edit drawer
 * (`MetaDrawerHeader`, pill footer, unsaved-changes hint and discard
 * confirmation); the form body is the existing `ContractPrivateInfoFields`
 * driven by `useContractPrivateInfoForm`, so validation and the upsert stay
 * shared with the BOQ list's dialog.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   privateInfo: import('../types/index.js').ContractPrivateInfo,
 *   onClose: () => void,
 * }} props
 */
export function ContractBoqEditDrawer({ contract, privateInfo, onClose }) {
  const formId = useId();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const form = useContractPrivateInfoForm({
    contractId: contract.id,
    privateInfo,
    onSuccess: onClose,
  });

  function requestClose() {
    if (form.isDirty) setIsConfirmingDiscard(true);
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
        width={DRAWER_WIDTH}
        isFullWidthOnMobile
        label="Chỉnh sửa BOQ"
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={ClipboardList}
                title="Chỉnh sửa BOQ"
                code={contract.contractNumber}
                badge={<MetaPill label="NỘI BỘ · BẢO MẬT" tone="neutral" />}
                onClose={requestClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={6}>
              <form
                id={formId}
                onSubmit={form.handleSubmit}
                {...stylex.props(styles.fields)}
              >
                <VStack gap={4} hAlign="stretch">
                  {form.submitError ? (
                    <Banner
                      status="error"
                      title={form.submitError}
                      container="card"
                    />
                  ) : null}
                  <ContractPrivateInfoFields
                    isReadOnly={false}
                    values={form.values}
                    setField={form.setField}
                    fieldStatuses={form.fieldStatuses}
                    logisticsTotal={privateInfo.logisticsTotal}
                    volumeDeclaration={privateInfo.volumeDeclaration}
                    extraFieldRows={form.extraFieldRows}
                  />
                </VStack>
              </form>
            </LayoutContent>
          }
          footer={
            <LayoutFooter padding={4}>
              <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
                <Text size="sm" color="secondary" xstyle={styles.hint}>
                  {form.isDirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}
                </Text>
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  <Button
                    label="Huỷ bỏ"
                    variant="secondary"
                    size="lg"
                    isDisabled={form.isSubmitting}
                    onClick={requestClose}
                  />
                  <Button
                    label={form.submitLabel}
                    type="submit"
                    form={formId}
                    variant="primary"
                    size="lg"
                    icon={<Icon icon={Save} size="sm" />}
                    isLoading={form.isSubmitting}
                  />
                </HStack>
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>

      <CommonDialog
        isOpen={isConfirmingDiscard}
        onOpenChange={(open) => {
          if (!open) setIsConfirmingDiscard(false);
        }}
        purpose="required"
      >
        <Layout
          header={
            <DialogHeader
              title="Bỏ thay đổi chưa lưu?"
              onOpenChange={() => setIsConfirmingDiscard(false)}
            />
          }
          content={
            <LayoutContent padding={4}>
              <Text>Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu.</Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Tiếp tục nhập"
                  variant="primary"
                  onClick={() => setIsConfirmingDiscard(false)}
                />
                <Button
                  label="Bỏ thay đổi"
                  variant="destructive"
                  onClick={() => {
                    setIsConfirmingDiscard(false);
                    onClose();
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </MetaThemeProvider>
  );
}
