'use client';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { AdvancedFilterBuilder } from './advanced-filter-builder.jsx';
import { CommonDialog } from './common-dialog.jsx';
const styles = stylex.create({
  advancedSearchPanel: {
    paddingBlock: spacingVars['--spacing-3'],
    paddingInline: spacingVars['--spacing-3'],
  },
});
/** @typedef {{ field: string, label: string, placeholder?: string, type?: 'string' | 'enum', options?: ReadonlyArray<{value: string, label?: string}> }} AdvancedSearchField */
/** @param {{
 * isServerFilterMode: boolean,
 * isAdvancedSearchOpen: boolean,
 * handleAdvancedSearchOpenChange: (open: boolean) => void,
 * filterFieldDefs?: ReadonlyArray<import('./advanced-filter-builder.jsx').AdvancedFilterFieldDef>,
 * advancedFilterDraft: import('./advanced-filter-builder.jsx').AdvancedFilterCondition[],
 * setAdvancedFilterDraft: import('react').Dispatch<import('react').SetStateAction<import('./advanced-filter-builder.jsx').AdvancedFilterCondition[]>>,
 * handleAdvancedFilterClear: () => void,
 * handleAdvancedFilterSubmit: () => void,
 * advancedSearchFieldsResolved: ReadonlyArray<AdvancedSearchField>,
 * advancedSearchDraft: Record<string, string>,
 * setAdvancedSearchDraft: import('react').Dispatch<import('react').SetStateAction<Record<string, string>>>,
 * handleAdvancedSearchSubmit: () => void,
 * }} props */
export function AdvanceTableSearchDialog({
  isServerFilterMode,
  isAdvancedSearchOpen,
  handleAdvancedSearchOpenChange,
  filterFieldDefs,
  advancedFilterDraft,
  setAdvancedFilterDraft,
  handleAdvancedFilterClear,
  handleAdvancedFilterSubmit,
  advancedSearchFieldsResolved,
  advancedSearchDraft,
  setAdvancedSearchDraft,
  handleAdvancedSearchSubmit,
}) {
  return (
    <>
      {isServerFilterMode ? (
        <CommonDialog
          isOpen={isAdvancedSearchOpen}
          onOpenChange={handleAdvancedSearchOpenChange}
          purpose="form"
          width={800}
        >
          <Layout
            header={
              <DialogHeader
                title="Bộ lọc nâng cao"
                onOpenChange={handleAdvancedSearchOpenChange}
              />
            }
            content={
              <LayoutContent>
                <VStack
                  gap={3}
                  hAlign="stretch"
                  xstyle={styles.advancedSearchPanel}
                >
                  <AdvancedFilterBuilder
                    fields={filterFieldDefs ?? []}
                    conditions={advancedFilterDraft}
                    onChange={setAdvancedFilterDraft}
                  />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack hAlign="between">
                  <Button
                    label="Bỏ lọc"
                    variant="secondary"
                    onClick={handleAdvancedFilterClear}
                  />
                  <Button
                    label="Lọc"
                    variant="primary"
                    onClick={handleAdvancedFilterSubmit}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </CommonDialog>
      ) : advancedSearchFieldsResolved.length > 0 ? (
        <CommonDialog
          isOpen={isAdvancedSearchOpen}
          onOpenChange={handleAdvancedSearchOpenChange}
          purpose="form"
          width={400}
        >
          <Layout
            header={
              <DialogHeader
                title="Tìm kiếm nâng cao"
                onOpenChange={handleAdvancedSearchOpenChange}
              />
            }
            content={
              <LayoutContent>
                <VStack
                  gap={3}
                  hAlign="stretch"
                  xstyle={styles.advancedSearchPanel}
                >
                  {advancedSearchFieldsResolved.map((field) =>
                    field.type === 'enum' ? (
                      <Selector
                        key={field.field}
                        label={field.label}
                        isLabelHidden
                        placeholder={field.placeholder ?? field.label}
                        hasClear
                        options={[...(field.options ?? [])]}
                        value={advancedSearchDraft[field.field] ?? null}
                        onChange={(next) =>
                          setAdvancedSearchDraft((current) => ({
                            ...current,
                            [field.field]: next ?? '',
                          }))
                        }
                      />
                    ) : (
                      <TextInput
                        key={field.field}
                        label={field.label}
                        isLabelHidden
                        placeholder={field.placeholder ?? field.label}
                        hasClear
                        value={advancedSearchDraft[field.field] ?? ''}
                        onChange={(next) =>
                          setAdvancedSearchDraft((current) => ({
                            ...current,
                            [field.field]: next,
                          }))
                        }
                        onEnter={handleAdvancedSearchSubmit}
                      />
                    ),
                  )}
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack hAlign="end">
                  <Button
                    label="Tìm kiếm"
                    variant="primary"
                    onClick={handleAdvancedSearchSubmit}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </CommonDialog>
      ) : null}
    </>
  );
}
