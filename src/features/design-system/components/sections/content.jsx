'use client';

import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Blockquote } from '@astryxdesign/core/Blockquote';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { ShowcaseSection } from '../showcase-section.jsx';

// The one sanctioned exception to the no-hardcoded-hex rule: this is a
// CodeBlock sample *of* theme.js, so the hex values are the subject matter.
// It drifted out of sync once already (documented --color-accent as the red
// #b91a24 while the real accent was teal), which is what prompted the lint
// rule — keep it in step with src/shared/components/custom/meta/theme.js
// by hand.
/* eslint-disable no-restricted-syntax */
const THEME_SNIPPET = `export const metaTheme = defineTheme({
  name: 'meta',
  tokens: {
    '--color-accent': '#0064e0', // spec: primary-container
    '--color-background-body': '#faf8ff', // spec: background / surface
  },
});`;
/* eslint-enable no-restricted-syntax */

export function ContentSection() {
  return (
    <>
      <ShowcaseSection title="Divider / Breadcrumbs / Icon">
        <VStack gap={5}>
          <VStack gap={3} width="100%" maxWidth={400}>
            <Divider variant="subtle" />
            <Divider variant="strong" />
            <Divider label="hoặc" />
          </VStack>
          <Breadcrumbs>
            <BreadcrumbItem href="/">Trang chủ</BreadcrumbItem>
            <BreadcrumbItem href="/design-system">Design System</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Nội dung</BreadcrumbItem>
          </Breadcrumbs>
          <HStack gap={4} wrap="wrap">
            <Icon icon="search" color="primary" />
            <Icon icon="check" color="success" />
            <Icon icon="error" color="error" />
            <Icon icon="warning" color="warning" />
            <Icon icon="info" color="accent" />
          </HStack>
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection title="Blockquote / CodeBlock">
        <VStack gap={5}>
          <Blockquote cite="AGENTS.md">
            Mọi màu đều lấy từ Astryx theme token trong
            src/shared/components/custom/meta/theme.js — không hardcode hex trong component.
          </Blockquote>
          <CodeBlock
            code={THEME_SNIPPET}
            language="typescript"
            title="src/shared/components/custom/meta/theme.js"
            hasLineNumbers
          />
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection title="AspectRatio">
        <AspectRatio
          ratio={16 / 9}
          fit="contain"
          style={{
            height: 160,
            width: 'auto',
            borderRadius: 'var(--radius-container)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-dn-group.png" alt="Logo KT-XNK" />
        </AspectRatio>
      </ShowcaseSection>

      <ShowcaseSection
        title="Collapsible"
        description='CollapsibleGroup type="single" cho hành vi accordion — mở mục này tự đóng mục kia.'
      >
        <CollapsibleGroup type="single" defaultValue="general">
          <VStack gap={6} style={{ maxWidth: 480 }}>
            <Collapsible trigger="Thông tin chung" value="general">
              <Text type="body" color="secondary">
                Tên công ty, mã số thuế, địa chỉ đăng ký kinh doanh.
              </Text>
            </Collapsible>
            <Collapsible trigger="Chứng từ xuất nhập khẩu" value="documents">
              <Text type="body" color="secondary">
                Invoice, packing list, bill of lading, C/O.
              </Text>
            </Collapsible>
          </VStack>
        </CollapsibleGroup>
      </ShowcaseSection>
    </>
  );
}
