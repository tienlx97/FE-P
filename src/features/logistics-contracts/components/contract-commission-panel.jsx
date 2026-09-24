'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import {
  MetaCommissionEmptyState,
  MetaCommissionParties,
  MetaCommissionSummaryCards,
} from '@/shared/components/custom/meta/index.js';

import { commissionDetailHref } from '../config/commission-routes.js';
import { useCommissionView } from '../hooks/use-commission-view.js';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';

/**
 * Contract detail "Hoa hồng" tab: just enough to know where the commission
 * stands — the 3 KPI cards and the broker — with "Xem chi tiết hoa hồng"
 * to the commission detail page (`/logistics/contract/[id]/commission`,
 * tabs Tổng quan / Tiến độ thanh toán / Phụ lục). Without a commission,
 * an empty state creates one in the Meta drawer.
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractCommissionPanel({ contract }) {
  const [isCreating, setIsCreating] = useState(false);
  const { commissionQuery, commission, currency, isLoading, view } =
    useCommissionView(contract);

  if (!commission || !view) {
    return (
      <>
        <MetaCommissionEmptyState
          isLoading={commissionQuery.isLoading}
          onCreate={() => setIsCreating(true)}
        />
        {isCreating ? (
          <CommissionFormDrawer
            contract={contract}
            onClose={() => setIsCreating(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
        <Heading level={3}>Commission · {commission.code}</Heading>
        <Button
          label="Xem chi tiết hoa hồng"
          variant="secondary"
          href={commissionDetailHref(contract.id)}
          endContent={<Icon icon={ArrowRight} size="sm" />}
        />
      </HStack>
      <MetaCommissionSummaryCards
        currency={currency}
        summary={view.summary}
        isLoading={isLoading}
      />
      <MetaCommissionParties broker={view.broker} isLoading={isLoading} />
    </VStack>
  );
}
