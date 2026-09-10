import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';

import { companies } from '../config/companies.js';
import { SectionHeading } from './section-heading.jsx';

const styles = stylex.create({
  logo: {
    height: spacingVars['--spacing-10'],
    maxWidth: '100%',
    objectFit: 'contain',
    width: 'auto',
  },
  // Offsets the `#he-sinh-thai` anchor past the sticky 64px header instead
  // of landing flush under it.
  anchor: {
    scrollMarginTop: '80px',
  },
});

export function Ecosystem() {
  return (
    <VStack id="he-sinh-thai" gap={5} xstyle={styles.anchor}>
      <SectionHeading title="Hệ sinh thái" />
      <Grid columns={{ minWidth: 160, max: 6 }} gap={4}>
        {companies.map(({ name, logo }) => (
          <VStack key={name} gap={2} hAlign="center">
            <Image
              src={logo.src}
              alt={`Logo ${name}`}
              width={logo.width}
              height={logo.height}
              {...stylex.props(styles.logo)}
            />
            <Text type="supporting">
              {name}
            </Text>
          </VStack>
        ))}
      </Grid>
    </VStack>
  );
}
