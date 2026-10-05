'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';

/** @typedef {import('../config/shipment-form-sections.js').ShipmentFormSection} ShipmentFormSection */
/** @typedef {ReturnType<typeof import('../config/shipment-form-sections.js').sectionCompleteness>} Completeness */

/** @param {Completeness} completeness */
function stateText(completeness) {
  switch (completeness.state) {
    case 'error':
      return 'Có lỗi cần sửa';
    case 'complete':
      return 'Đã đủ thông tin';
    case 'missing':
      return `Còn ${completeness.missing} mục`;
    default:
      return 'Tuỳ chọn';
  }
}

/** @param {{ completeness: Completeness }} props */
function StateIcon({ completeness }) {
  if (completeness.state === 'error') {
    return (
      <Icon
        icon={CircleAlert}
        size="sm"
        color="inherit"
        xstyle={styles.error}
      />
    );
  }
  if (completeness.state === 'complete') {
    return (
      <Icon icon={CircleCheck} size="sm" color="inherit" xstyle={styles.done} />
    );
  }
  return <Icon icon={CircleDashed} size="sm" color="secondary" />;
}

/**
 * Outline beside the shipment form: the groups under the stage they belong
 * to, each with how complete it is. Choosing one opens and scrolls to it.
 * @param {{
 *   sections: { section: ShipmentFormSection, completeness: Completeness }[],
 *   onSelect: (id: ShipmentFormSection['id']) => void,
 * }} props
 */
export function ShipmentFormOutline({ sections, onSelect }) {
  const groups = [...new Set(sections.map(({ section }) => section.group))];
  return (
    <VStack as="nav" aria-label="Các nhóm thông tin" gap={3} hAlign="stretch">
      {groups.map((group) => (
        <List
          key={group}
          density="compact"
          header={
            <Text size="sm" weight="semibold" color="secondary">
              {group}
            </Text>
          }
        >
          {sections
            .filter(({ section }) => section.group === group)
            .map(({ section, completeness }) => (
              <ListItem
                key={section.id}
                label={section.title}
                description={stateText(completeness)}
                startContent={<StateIcon completeness={completeness} />}
                onClick={() => onSelect(section.id)}
              />
            ))}
        </List>
      ))}
    </VStack>
  );
}

const styles = stylex.create({
  done: { color: 'var(--meta-emerald-text)' },
  error: { color: 'var(--meta-danger-icon)' },
});
