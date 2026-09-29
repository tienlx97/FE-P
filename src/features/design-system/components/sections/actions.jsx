'use client';

import { Button } from '@astryxdesign/core/Button';
import { ButtonGroup } from '@astryxdesign/core/ButtonGroup';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { ShowcaseSection } from '../showcase-section.jsx';

/** @type {('primary' | 'secondary' | 'ghost' | 'destructive')[]} */
const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'];

export function ActionsSection() {
  const [isBold, setIsBold] = useState(false);
  const [isStarred, setIsStarred] = useState(true);

  return (
    <>
      <ShowcaseSection
        title="Button"
        description={
          'variant là mức nhấn mạnh, không phải màu brand: primary = cobalt Meta (--color-accent), ' +
          'secondary = viền trắng hairline, ghost = trong suốt, destructive = đỏ lỗi (--color-error).'
        }
      >
        <VStack gap={3}>
          <HStack gap={3} wrap="wrap" vAlign="center">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} label={variant} variant={variant} />
            ))}
          </HStack>
          <HStack gap={3} wrap="wrap" vAlign="center">
            <Button label="Small" variant="primary" size="sm" />
            <Button label="Medium" variant="primary" size="md" />
            <Button label="Large" variant="primary" size="lg" />
            <Button label="Disabled" variant="primary" isDisabled />
            <Button label="Loading" variant="primary" isLoading />
          </HStack>
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection
        title="ButtonGroup / IconButton"
        description="ButtonGroup nối các nút liên quan thành một khối liền border. IconButton dùng cho hành động chỉ có icon, luôn cần label cho a11y."
      >
        <HStack gap={4} wrap="wrap" vAlign="center">
          <ButtonGroup label="Định dạng văn bản">
            <IconButton
              label="Đậm"
              tooltip="Đậm"
              icon={<Icon icon="check" size="sm" />}
            />
            <IconButton
              label="In nghiêng"
              tooltip="In nghiêng"
              icon={<Icon icon="close" size="sm" />}
            />
            <IconButton
              label="Gạch chân"
              tooltip="Gạch chân"
              icon={<Icon icon="arrowDown" size="sm" />}
            />
          </ButtonGroup>
          <IconButton
            label="Tìm kiếm"
            tooltip="Tìm kiếm"
            icon={<Icon icon="search" size="sm" />}
            variant="secondary"
          />
        </HStack>
      </ShowcaseSection>

      <ShowcaseSection
        title="ToggleButton"
        description="Bật/tắt trạng thái bền (favorite, mute...) — khác Switch ở chỗ trông và dùng như một nút bấm."
      >
        <HStack gap={3} vAlign="center">
          <ToggleButton
            label="Bold"
            isPressed={isBold}
            onPressedChange={setIsBold}
          />
          <ToggleButton
            label="Yêu thích"
            icon={<Icon icon="check" size="sm" />}
            isPressed={isStarred}
            onPressedChange={setIsStarred}
            isIconOnly
          />
        </HStack>
      </ShowcaseSection>

      <ShowcaseSection
        title="Link"
        description="Link màu accent (cobalt Meta, --color-text-accent)."
      >
        <HStack gap={4} wrap="wrap">
          <Link href="/" isStandalone>
            Link nội bộ
          </Link>
          <Link href="https://github.com" isExternalLink isStandalone>
            Link ngoài (mở tab mới)
          </Link>
        </HStack>
      </ShowcaseSection>
    </>
  );
}
