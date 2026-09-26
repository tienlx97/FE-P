'use client';

import { VStack } from '@astryxdesign/core/VStack';

import {
  MetaInfoNote,
  MetaInlineCode,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { AmountInWordsSection } from './amount-in-words-section.jsx';
import { InstallmentsSection } from './installments-section.jsx';

/** "Tiện ích › Giá trị" (Figma 156:2): the two module cards + a format note. */
export function ValueUtility() {
  return (
    <MetaThemeProvider>
      <VStack gap={6} hAlign="stretch">
        <AmountInWordsSection />
        <InstallmentsSection />
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
