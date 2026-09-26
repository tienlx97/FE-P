'use client';

import { Divider } from '@astryxdesign/core/Divider';
import { VStack } from '@astryxdesign/core/VStack';

import { AmountInWordsSection } from './amount-in-words-section.jsx';
import { InstallmentsSection } from './installments-section.jsx';

/** "Tiện ích › Giá trị": amount in words, then installment split. */
export function ValueUtility() {
  return (
    <VStack gap={8} hAlign="stretch">
      <AmountInWordsSection />
      <Divider />
      <InstallmentsSection />
    </VStack>
  );
}
