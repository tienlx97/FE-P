import { Section } from '@astryxdesign/core/Section';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import {
  ActionsSection,
  ContentSection,
  DataDisplaySection,
  FeedbackSection,
  FormsSection,
  OverlaysSection,
  SelectionSection,
  TypographySection,
} from '@/features/design-system/index.js';

export default function DesignSystemPage() {
  return (
    <Section variant="transparent" paddingBlock={8}>
      <VStack gap={0}>
        <VStack gap={2} paddingBlock={2}>
          <Heading level={1} type="display-2">
            Design system
          </Heading>
          <Text type="large" color="secondary">
            Component thật từ <code>@astryxdesign/core</code>, chạy trên theme
            Meta (<code>src/shared/components/custom/meta/theme.js</code>):
            accent cobalt, nền — chữ — viền trên dải trung tính lạnh, font
            InterVariable. Trang này không phải trang nội dung
            — dùng để soi màu/typo/variant khi thêm component mới. Chưa demo:
            Chat, PowerSearch, Calendar, DateInput, Carousel, Lightbox,
            TreeList, ContextMenu, MoreMenu, Markdown — phức tạp/cần dữ liệu
            ngoài, tra riêng qua <code>xds</code> MCP khi cần.
          </Text>
        </VStack>

        <TypographySection />
        <ActionsSection />
        <FormsSection />
        <SelectionSection />
        <FeedbackSection />
        <OverlaysSection />
        <DataDisplaySection />
        <ContentSection />
      </VStack>
    </Section>
  );
}
