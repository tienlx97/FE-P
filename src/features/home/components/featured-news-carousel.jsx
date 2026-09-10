'use client';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading, Text } from '@astryxdesign/core/Text';
import {
  colorVars,
  radiusVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { formatLongDate } from '../api/date.js';
import { featuredNews } from '../config/news.js';

const styles = stylex.create({
  swiper: {
    // Pagination dots sit inside the slide (over the photo), so the swiper
    // needs no extra block padding underneath for them.
    borderColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-inner'],
    borderStyle: 'solid',
    borderWidth: '1px',
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  slide: {
    // Standard 16:9, capped with `maxHeight` from tablet up: this hero
    // spans the full ~80rem content column, so an uncapped 16:9 box hit
    // ~690px tall at desktop widths — nearly the whole viewport for one
    // slide. The cap keeps the crop close to 16:9 without letting the
    // slide's height keep scaling with the page's full width; mobile has
    // no cap because its narrower width already keeps the ratio short.
    // `position: relative` is what makes `next/image` `fill` legal here:
    // the filled image resolves against the nearest positioned ancestor.
    aspectRatio: {
      default: '4 / 3',
      '@media (min-width: 640px)': '16 / 9',
    },
    maxHeight: {
      default: 'none',
      '@media (min-width: 640px)': '420px',
      '@media (min-width: 1024px)': '480px',
    },
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  photo: {
    height: '100%',
    inset: 0,
    objectFit: 'cover',
    position: 'absolute',
    width: '100%',
  },
  // The section around the carousel is now a plain light card — see
  // `welcome-hero.jsx` — but each SLIDE is still a photo, so its own copy
  // still needs a dark scrim + on-dark text to stay readable. This is
  // local to the slide, not a page-wide dark theme.
  scrim: {
    backgroundImage: `linear-gradient(to top, color-mix(in srgb, ${colorVars['--color-background-inverted']} 92%, transparent), color-mix(in srgb, ${colorVars['--color-background-inverted']} 74%, transparent) 45%, transparent 90%)`,
    inset: 0,
    position: 'absolute',
  },
  body: {
    color: colorVars['--color-on-dark'],
    inset: 0,
    padding: {
      default: '20px',
      '@media (min-width: 640px)': '28px',
    },
    // Wider than the block padding on mobile so the headline clears
    // Swiper's own prev/next arrows, which it renders inset from the edge.
    paddingInline: {
      default: '42px',
      '@media (min-width: 640px)': '28px',
    },
    position: 'absolute',
  },
  chip: {
    backgroundColor: colorVars['--color-error'],
    borderRadius: radiusVars['--radius-full'],
    color: colorVars['--color-on-error'],
    flexShrink: 0,
    paddingBlock: '4px',
    paddingInline: '10px',
  },
  headline: {
    fontSize: {
      default: 'var(--font-size-xl)',
      '@media (min-width: 640px)': 'var(--font-size-3xl)',
    },
  },
});

/**
 * The hero's featured-news slider — one slide per `featuredNews` entry.
 * Split out of `welcome-hero.jsx` so the client-only Swiper boundary is as
 * small as possible; the greeting and quick-launch panel around it stay
 * plain server-rendered markup.
 *
 * Each slide is a single `ClickableCard`, so the whole photo is the
 * navigation target and there is exactly one focusable link per slide.
 */
export function FeaturedNewsCarousel() {
  return (
    <Swiper
      modules={[Navigation, Pagination, Keyboard, A11y]}
      keyboard={{ enabled: true }}
      navigation
      pagination={{ clickable: true }}
      loop
      a11y={{
        prevSlideMessage: 'Tin trước đó',
        nextSlideMessage: 'Tin tiếp theo',
        paginationBulletMessage: 'Đi tới tin {{index}}',
      }}
      // Swiper's own theme vars — plain CSS custom properties on `style`,
      // since they target DOM Swiper renders internally and StyleX rejects
      // custom-property keys inside `stylex.create`. Inactive bullets
      // default to black at 0.2 opacity, invisible over a photo, so they're
      // repointed at the on-dark token used by the slide copy.
      style={{
        '--swiper-navigation-size': '20px',
        '--swiper-pagination-bullet-inactive-color': 'var(--color-on-dark)',
        '--swiper-pagination-bullet-inactive-opacity': '0.45',
        '--swiper-theme-color': 'var(--color-on-dark)',
      }}
      {...stylex.props(styles.swiper)}
    >
      {featuredNews.map(({ id, category, date, title, image, href }, index) => (
        <SwiperSlide key={id}>
          <ClickableCard
            href={href}
            label={title}
            padding={0}
            variant="transparent"
            xstyle={styles.slide}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              // Only the first slide is above the fold on load; the rest
              // stay lazy so the hero costs one image, not four.
              priority={index === 0}
              {...stylex.props(styles.photo)}
            />
            <VStack xstyle={styles.scrim} />
            <VStack justify="end" xstyle={styles.body}>
              <VStack gap={2}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <HStack xstyle={styles.chip}>
                    <Text type="supporting" color="inherit" weight="bold">
                      {category}
                    </Text>
                  </HStack>
                  <Text type="supporting" color="inherit" weight="medium">
                    {formatLongDate(date)}
                  </Text>
                </HStack>
                <Heading
                  level={2}
                  type="display-3"
                  color="inherit"
                  xstyle={styles.headline}
                >
                  {title}
                </Heading>
              </VStack>
            </VStack>
          </ClickableCard>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
