import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * The one header every home-page section uses: title, optional supporting
 * line, and an optional "see everything" link pushed to the end of the row.
 * Centralising it is what keeps the six sections on a single typographic
 * rhythm — previously each section hand-rolled its own `Heading` and they
 * drifted between `display-2` and `display-3`.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   linkHref?: string,
 *   linkLabel?: string,
 *   id?: string,
 * }} props
 */
export function SectionHeading({
  title,
  description,
  linkHref,
  linkLabel,
  id,
}) {
  return (
    <HStack gap={4} justify="between" vAlign="end" wrap="wrap">
      <VStack gap={1}>
        <Heading id={id} level={2}>
          {title}
        </Heading>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </VStack>
      {linkHref && linkLabel ? (
        <Link href={linkHref} isStandalone>
          {linkLabel}
          <Icon icon="chevronRight" size="sm" />
        </Link>
      ) : null}
    </HStack>
  );
}
