'use client';

import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Calculator, SpellCheck2, WalletCards } from 'lucide-react';
import { useState } from 'react';

import {
  MetaInfoNote,
  MetaInlineCode,
  MetaPageHeader,
  MetaPill,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { AmountInWordsSection } from './amount-in-words-section.jsx';
import { InstallmentsSection } from './installments-section.jsx';

const PANEL_ID = 'value-utility-panel';

const TABS = [
  { id: 'words', label: 'Đọc số tiền bằng chữ', icon: SpellCheck2 },
  { id: 'installments', label: 'Chia đợt thanh toán', icon: WalletCards },
];

/**
 * "Tiện ích › Giá trị" (Figma 156:2): Meta page header, one tab per
 * module (both stay mounted, so switching keeps what was typed), and the
 * number-format note.
 */
export function ValueUtility() {
  const [activeId, setActiveId] = useState(TABS[0].id);

  return (
    <MetaThemeProvider>
      <VStack gap={6} hAlign="stretch">
        <MetaPageHeader
          trail={[
            { label: 'Logistics', href: '/logistics' },
            { label: 'Tiện ích' },
            { label: 'Giá trị' },
          ]}
          icon={Calculator}
          title="Giá trị"
          description="Đọc số tiền bằng chữ và chia giá trị theo đợt thanh toán."
          meta={<MetaPill label="USD · VNĐ" tone="neutral" />}
        />
        <MetaTabNav
          tabs={TABS}
          activeId={activeId}
          onChange={setActiveId}
          panelId={PANEL_ID}
          isSticky={false}
        />
        <VStack id={PANEL_ID} role="tabpanel" gap={6} hAlign="stretch">
          <VStack
            hAlign="stretch"
            xstyle={activeId !== 'words' && styles.hidden}
          >
            <AmountInWordsSection />
          </VStack>
          <VStack
            hAlign="stretch"
            xstyle={activeId !== 'installments' && styles.hidden}
          >
            <InstallmentsSection />
          </VStack>
        </VStack>
        <MetaInfoNote>
          Định dạng số theo tiêu chuẩn kế toán quốc tế (ngăn cách hàng nghìn
          bằng dấu phẩy <MetaInlineCode>,</MetaInlineCode> và phần thập phân
          bằng dấu chấm <MetaInlineCode>.</MetaInlineCode>). USD đọc đến xu
          (cent), VNĐ làm tròn đến đồng.
        </MetaInfoNote>
      </VStack>
    </MetaThemeProvider>
  );
}

const styles = stylex.create({
  // Inactive module: kept mounted (its inputs survive a tab switch), not shown.
  hidden: {
    display: 'none',
  },
});
