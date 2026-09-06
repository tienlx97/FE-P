'use client';

import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { VStack } from '@astryxdesign/core/VStack';

/** A named topic within a form's CollapsibleGroup.
 * @param {{ value: string, title: string, isDisabled?: boolean, children: import('react').ReactNode }} props
 */
export function FormSection({ value, title, isDisabled = false, children }) {
  return (
    <Card>
      <Collapsible value={value} trigger={title} isDisabled={isDisabled}>
        <VStack gap={3} hAlign="stretch" paddingBlock={3}>
          {children}
        </VStack>
      </Collapsible>
    </Card>
  );
}
