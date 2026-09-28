'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CircleCheck, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import {
  groupMeaning,
  recommendedFees,
} from '../config/cost-item-templates.js';
import { useShipmentCostItemTemplatesQuery } from '../hooks/use-shipment-cost-item-templates-query.js';

/**
 * Pick a recommended fee from the cost form. This drawer stacks above it and
 * returns the selected template to the still-open form.
 * @param {{
 *   costCategories: import('../types/index.js').ShipmentCostCategory[],
 *   initialCostCategoryId?: string,
 *   onClose: () => void,
 *   onSelect: (fee: import('../types/index.js').ShipmentCostItemTemplate) => void,
 * }} props
 */
export function ShipmentRecommendedFeeDrawer({
  costCategories,
  initialCostCategoryId,
  onClose,
  onSelect,
}) {
  const [categoryId, setCategoryId] = useState(
    initialCostCategoryId || costCategories[0]?.id || '',
  );
  const [query, setQuery] = useState('');
  const [feeId, setFeeId] = useState('');
  const templatesQuery = useShipmentCostItemTemplatesQuery();
  const templates = templatesQuery.data?.success
    ? templatesQuery.data.costItemTemplates
    : [];
  const category = costCategories.find((item) => item.id === categoryId);
  const groupFees = categoryId ? recommendedFees(templates, categoryId) : [];
  const visibleFees = categoryId
    ? recommendedFees(templates, categoryId, query)
    : [];
  const selectedFee = groupFees.find((fee) => fee.id === feeId);

  return (
    <MetaFormDrawer
      icon={Sparkles}
      title="Chọn phí khuyến nghị"
      meta={<MetaPill label="Danh mục LOG" tone="accent" />}
      width={640}
      draft={null}
      showDirtyHint={false}
      submitLabel="Áp dụng loại phí"
      isSubmitDisabled={!selectedFee}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (selectedFee) onSelect(selectedFee);
      }}
    >
      <MetaFormSection isBoxed isTitleUppercase={false} title="Nhóm chi phí">
        <VStack gap={3} hAlign="stretch">
          <Selector
            label="Nhóm chi phí"
            options={costCategories.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value);
              setQuery('');
              setFeeId('');
            }}
            width="100%"
          />
          {category ? (
            <HStack gap={2} vAlign="center" wrap="wrap">
              <MetaPill label={category.code} tone="accent" />
              <Text size="sm" color="secondary">
                {groupMeaning(category.note)}
              </Text>
            </HStack>
          ) : null}
        </VStack>
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        title="Loại phí khuyến nghị"
        meta={
          <MetaPill
            label={`${visibleFees.length}/${groupFees.length} loại phí`}
            tone="neutral"
          />
        }
      >
        <VStack gap={3} hAlign="stretch">
          <TextInput
            label="Tìm loại phí"
            isLabelHidden
            startIcon={Search}
            hasClear
            value={query}
            onChange={setQuery}
            placeholder="Tìm tên phí hoặc từ khóa invoice"
            width="100%"
          />
          {templatesQuery.isLoading ? (
            <Text size="sm" color="secondary">
              Đang tải danh mục phí…
            </Text>
          ) : visibleFees.length === 0 ? (
            <Text size="sm" color="secondary">
              {groupFees.length === 0
                ? 'Nhóm này chưa có loại phí khuyến nghị.'
                : 'Không tìm thấy loại phí phù hợp.'}
            </Text>
          ) : (
            <List density="compact" hasDividers xstyle={styles.feeList}>
              {visibleFees.map((fee) => (
                <ListItem
                  key={fee.id}
                  label={fee.name}
                  description={[fee.nameEn, fee.occurrencePoint]
                    .filter(Boolean)
                    .join(' · ')}
                  isSelected={fee.id === feeId}
                  onClick={() => setFeeId(fee.id)}
                  endContent={
                    <HStack gap={2} vAlign="center">
                      {fee.defaultCostNature === 'Abnormal' ? (
                        <MetaPill label="Abnormal" tone="warning" size="sm" />
                      ) : null}
                      {fee.id === feeId ? (
                        <Icon icon={CircleCheck} size="md" color="accent" />
                      ) : null}
                    </HStack>
                  }
                />
              ))}
            </List>
          )}
        </VStack>
      </MetaFormSection>

      {selectedFee ? (
        <HStack gap={3} vAlign="center" wrap="wrap" xstyle={styles.selected}>
          <Icon icon={Sparkles} size="md" color="accent" />
          <VStack gap={0.5} hAlign="stretch">
            <Text weight="semibold">{selectedFee.name}</Text>
            <Text size="sm" color="secondary">
              Nhóm {category?.code} · Cost Nature{' '}
              {selectedFee.defaultCostNature}
            </Text>
          </VStack>
        </HStack>
      ) : null}
    </MetaFormDrawer>
  );
}

const styles = stylex.create({
  feeList: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
  },
  selected: {
    backgroundColor: 'var(--meta-blue-active-bg)',
    borderColor: 'var(--meta-blue-wash-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
});
