'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Section } from '@astryxdesign/core/Section';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

const COPIED_RESET_MS = 2000;

/**
 * Read-only "Bằng chữ" box with a copy button.
 * @param {{ words: string, placeholder?: string }} props
 */
export function WordsOutput({
  words,
  placeholder = 'Nhập số tiền để xem bằng chữ',
}) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(words);
      setIsCopied(true);
    } catch (error) {
      console.error('Không sao chép được chữ số tiền', error);
    }
  };

  return (
    <Section variant="muted" padding={3}>
      <HStack gap={3} vAlign="center" wrap="nowrap">
        <StackItem size="fill">
          <Text
            as="p"
            weight={words ? 'semibold' : 'normal'}
            color={words ? 'primary' : 'placeholder'}
          >
            {words || placeholder}
          </Text>
        </StackItem>
        <IconButton
          label={isCopied ? 'Đã sao chép' : 'Sao chép bằng chữ'}
          tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
          icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
          type="button"
          variant="ghost"
          size="sm"
          isDisabled={!words}
          onClick={handleCopy}
        />
      </HStack>
    </Section>
  );
}
