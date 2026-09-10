import { Grid } from '@astryxdesign/core/Grid';
import { Section } from '@astryxdesign/core/Section';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, radiusVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import {
  AnnouncementsBoard,
  Ecosystem,
  NewsHighlights,
  UpcomingEvents,
  VideoClips,
  WelcomeHero,
} from '../../features/home/index.js';

// The protected shell owns the header and page inset.
const styles = stylex.create({
  content: { marginInline: 'auto' },
  columns: {
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 1100px)': 'minmax(0, 1.7fr) minmax(0, 1fr)',
    },
  },
  region: { minWidth: 0 },
  // A soft band for the secondary media/ecosystem block, so the page reads
  // as two rhythmic bands instead of one unbroken white column. Applied to
  // a plain VStack (not a nested Section) so it keeps inheriting full
  // inline width from the page's Grid/VStack ancestors — a second Section
  // here shrinks to its content's intrinsic width instead of stretching.
  band: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-container'],
    paddingBlock: {
      default: '20px',
      '@media (min-width: 640px)': '32px',
    },
    paddingInline: {
      default: '16px',
      '@media (min-width: 640px)': '24px',
    },
    width: '100%',
  },
});

export default function HomePage() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  return (
    <Section
      variant="transparent"
      padding={0}
      paddingBlock={4}
      maxWidth="80rem"
      xstyle={styles.content}
    >
      <VStack gap={8}>
        <VStack gap={1}>
          <Heading id="tin-tuc" level={1}>
            Bản tin công ty
          </Heading>
          <Text type="body" color="secondary">
            Tin tức, thông báo nội bộ và lịch công ty được cập nhật mới nhất
          </Text>
        </VStack>
        <Grid gap={8} xstyle={styles.columns}>
          <VStack gap={4} xstyle={styles.region}>
            <WelcomeHero />
            <NewsHighlights />
          </VStack>
          <VStack gap={6} xstyle={styles.region}>
            <AnnouncementsBoard />
            <UpcomingEvents initialDate={today} />
          </VStack>
        </Grid>
        <VStack gap={8} xstyle={styles.band}>
          <VideoClips />
          <Ecosystem />
        </VStack>
      </VStack>
    </Section>
  );
}
