'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
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
import { Check, Fuel } from 'lucide-react';
import { useId, useState } from 'react';

import {
  MetaDrawerHeader,
  MetaFormSection,
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { formatPeriodDate } from '../config/fuel-prices.js';
import { useUpsertFuelPricePeriodMutation } from '../hooks/use-fuel-prices.js';

const DRAWER_WIDTH = 560;

/** Today as ISO `YYYY-MM-DD` in local time. */
function todayIso() {
  const now = new Date();
  const pad = (/** @type {number} */ value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * "Nhập giá kỳ mới" / "Sửa kỳ dd/MM/yyyy": the period date + one price per
 * product (blank = not priced this period). Saving replaces every price of
 * that date (BE PUT), so editing a date that already exists overwrites it.
 * @param {{
 *   market: string,
 *   products: Array<{ code: string, label: string }>,
 *   period?: { date: string, prices: Record<string, number | undefined> },
 *   onClose: () => void,
 * }} props
 */
export function FuelPricePeriodDrawer({ market, products, period, onClose }) {
  const formId = useId();
  const toast = useAppToast();
  const mutation = useUpsertFuelPricePeriodMutation(market);
  const isEditing = Boolean(period);
  const [date, setDate] = useState(period?.date ?? todayIso());
  const [prices, setPrices] = useState(
    /** @type {Record<string, number | undefined>} */ ({
      ...(period?.prices ?? {}),
    }),
  );
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const items = products
    .filter(({ code }) => typeof prices[code] === 'number' && prices[code] > 0)
    .map(({ code, label }) => ({
      productCode: code,
      productName: label,
      price: /** @type {number} */ (prices[code]),
    }));

  /** @param {import('react').FormEvent} event */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!date) {
      setError('Chọn ngày điều chỉnh.');
      return;
    }
    if (items.length === 0) {
      setError('Nhập giá cho ít nhất một mặt hàng.');
      return;
    }
    setError(null);
    const result = await mutation.mutateAsync({ effectiveDate: date, items });
    if (!result.success) {
      setError(result.message);
      return;
    }
    toast({ body: `Đã lưu giá kỳ ${formatPeriodDate(date)}.` });
    onClose();
  }

  const title = isEditing
    ? `Sửa giá kỳ ${formatPeriodDate(period?.date ?? '')}`
    : 'Nhập giá kỳ mới';

  return (
    <MetaThemeProvider>
      <Drawer
        isOpen
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        side="end"
        width={DRAWER_WIDTH}
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
                icon={Fuel}
                title={title}
                code={market}
                badge={<MetaPill label="đ/lít" tone="neutral" />}
                onClose={onClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              <form
                id={formId}
                onSubmit={handleSubmit}
                noValidate
                {...stylex.props(styles.fields)}
              >
                <VStack gap={4} hAlign="stretch">
                  {error ? (
                    <Banner status="error" title={error} container="card" />
                  ) : null}
                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    title="Kỳ điều hành"
                  >
                    <DateInput
                      label="Ngày điều chỉnh"
                      value={
                        /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                          date || null
                        )
                      }
                      onChange={(value) => setDate(value ?? '')}
                      format={formatDateInputValue}
                      isRequired
                      isDisabled={isEditing}
                    />
                  </MetaFormSection>
                  <MetaFormSection
                    isBoxed
                    isTitleUppercase={false}
                    title="Giá bán lẻ"
                    meta={
                      <MetaPill
                        label={`${items.length}/${products.length} mặt hàng`}
                        tone="accent"
                      />
                    }
                  >
                    <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
                      {products.map(({ code, label }) => (
                        <FormattedNumberTextInput
                          key={code}
                          label={label}
                          value={prices[code]}
                          onChange={(value) =>
                            setPrices((current) => ({
                              ...current,
                              [code]: value,
                            }))
                          }
                          units="đ"
                        />
                      ))}
                    </Grid>
                  </MetaFormSection>
                </VStack>
              </form>
            </LayoutContent>
          }
          footer={
            <LayoutFooter padding={4}>
              <HStack hAlign="end" gap={2} wrap="nowrap">
                <Button
                  label="Huỷ bỏ"
                  variant="secondary"
                  size="lg"
                  isDisabled={mutation.isPending}
                  onClick={onClose}
                />
                <Button
                  label="Lưu giá"
                  type="submit"
                  form={formId}
                  variant="primary"
                  size="lg"
                  icon={<Icon icon={Check} size="sm" />}
                  isLoading={mutation.isPending}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>
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
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
  },
  // Same roomy form controls as the other Meta drawers.
  fields: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-radius': 'var(--meta-radius-inset)',
  },
});
