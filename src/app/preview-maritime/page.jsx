'use client';

import { Section } from '@astryxdesign/core/Section';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  MaritimeAnnexListPanel,
  MaritimeContractFoundationGrid,
  MaritimeContractOverviewCard,
  MaritimePaymentProgressPanel,
  MaritimePaymentSummaryCard,
  MaritimeShipmentListPanel,
  MaritimeTabNav,
  MaritimeThemeProvider,
} from '@/shared/components/custom/maritime/index.js';

/**
 * Scratch preview page for the "Maritime" custom theme (2026-09-18) — not
 * part of the app's navigation, safe to delete once the visual check is
 * done. Same throwaway-scratch pattern as the removed
 * `theme.template.ts` reference file.
 */
export default function PreviewMaritimePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <MaritimeThemeProvider>
      <Section variant="transparent" paddingBlock={6} xstyle={styles.page}>
        <VStack gap={4} paddingInline={6}>
          <MaritimeContractOverviewCard
            contractCode="CT-2024/EXP-088"
            projectName="Metro Line 2 (Bến Thành - Tham Lương)"
            typeLabel="Chính thức"
            statusLabel="Đang thực hiện"
            incotermLabel="CIF 2020"
            onExportPdf={() => {}}
            onEdit={() => {}}
            actionItems={[
              { id: 'packing', label: 'Tạo phiếu đóng hàng (Packing)' },
              { id: 'receipt', label: 'Lập phiếu thu tiền (Receipt)' },
              { id: 'annex', label: 'Thêm phụ lục hợp đồng (Addendum)' },
              {
                id: 'incident',
                label: 'Báo cáo sự cố lô hàng',
                variant: 'destructive',
              },
            ]}
          />
          <MaritimeTabNav activeId={activeTab} onChange={setActiveTab} />
          {activeTab === 'overview' ? (
            <>
              <MaritimePaymentSummaryCard />
              <MaritimeContractFoundationGrid />
            </>
          ) : null}
          {activeTab === 'payments' ? <MaritimePaymentProgressPanel /> : null}
          {activeTab === 'shipment' ? <MaritimeShipmentListPanel /> : null}
          {activeTab === 'annex' ? <MaritimeAnnexListPanel /> : null}
        </VStack>
      </Section>
    </MaritimeThemeProvider>
  );
}

const styles = stylex.create({
  page: {
    backgroundColor: 'var(--color-background-body)',
    minHeight: '100vh',
  },
});
