'use client';

import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, radiusVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import { useState } from 'react';

import { formatLongDate } from '../api/date.js';
import { videos } from '../config/videos.js';
import { IconPlay } from './icon-play.jsx';
import { SectionHeading } from './section-heading.jsx';

const styles = stylex.create({
  card: {
    height: '100%',
    overflow: 'hidden',
  },
  media: {
    borderStartEndRadius: radiusVars['--radius-container'],
    borderStartStartRadius: radiusVars['--radius-container'],
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    objectFit: 'cover',
  },
  // A soft wash over the whole thumbnail so the white play badge and the
  // duration chip stay legible whatever the photo underneath is doing.
  mediaScrim: {
    backgroundColor: colorVars['--color-overlay'],
    inset: 0,
    position: 'absolute',
  },
  playBadge: {
    backgroundColor: colorVars['--color-accent'],
    borderRadius: radiusVars['--radius-full'],
    color: colorVars['--color-on-accent'],
    height: '56px',
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    width: '56px',
  },
  durationChip: {
    backgroundColor: colorVars['--color-background-inverted'],
    borderRadius: radiusVars['--radius-inner'],
    color: colorVars['--color-on-dark'],
    insetBlockEnd: '8px',
    insetInlineEnd: '8px',
    position: 'absolute',
  },
  player: {
    borderRadius: radiusVars['--radius-element'],
    overflow: 'hidden',
  },
  frame: {
    borderStyle: 'none',
    height: '100%',
    width: '100%',
  },
});

/**
 * "Video clip" — thumbnail cards that open the player in a dialog.
 *
 * The YouTube iframe is only mounted once a card is opened (the facade
 * pattern): four embedded players on first paint would pull in several
 * hundred kB of third-party script for videos nobody has asked to watch
 * yet. `youtube-nocookie.com` is used so an unplayed — and even a played —
 * video sets no tracking cookie on an internal portal.
 */
export function VideoClips() {
  // `null` means the dialog is closed — and, because the iframe is rendered
  // from this value, that no player is mounted at all.
  const [activeVideo, setActiveVideo] = useState(
    /** @type {import('../config/videos.js').VideoClip | null} */ (null),
  );

  return (
    <VStack gap={5}>
      <SectionHeading id="video" title="Góc video" />
      <Grid columns={{ minWidth: 260, max: 4 }} gap={4}>
        {videos.map((video) => (
          <ClickableCard
            key={video.id}
            label={`Phát video: ${video.title}`}
            onClick={() => setActiveVideo(video)}
            padding={0}
            elevation="low"
            xstyle={styles.card}
          >
            <VStack height="100%">
              <VStack xstyle={styles.media}>
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={video.thumbnail.src}
                    alt={video.thumbnail.alt}
                    fill
                    sizes="(min-width: 1024px) 290px, (min-width: 640px) 50vw, 100vw"
                    {...stylex.props(styles.photo)}
                  />
                </AspectRatio>
                <VStack xstyle={styles.mediaScrim} />
                <VStack
                  hAlign="center"
                  vAlign="center"
                  xstyle={styles.playBadge}
                >
                  <Icon icon={IconPlay} size="lg" color="inherit" />
                </VStack>
                <VStack
                  paddingInline={1.5}
                  paddingBlock={0.5}
                  xstyle={styles.durationChip}
                >
                  <Text
                    type="supporting"
                    color="inherit"
                    hasTabularNumbers
                    display="block"
                  >
                    {video.duration}
                  </Text>
                </VStack>
              </VStack>
              <VStack gap={1.5} padding={4}>
                <Heading level={3} maxLines={2}>
                  {video.title}
                </Heading>
                <HStack gap={1.5} vAlign="center">
                  <Icon icon="calendar" size="xsm" color="secondary" />
                  <Text type="supporting">{formatLongDate(video.date)}</Text>
                </HStack>
              </VStack>
            </VStack>
          </ClickableCard>
        ))}
      </Grid>
      <Dialog
        isOpen={activeVideo !== null}
        onOpenChange={(isOpen) => {
          // Closing unmounts the iframe, which is what actually stops
          // playback — pausing it would leave the player running in the
          // background.
          if (!isOpen) setActiveVideo(null);
        }}
        width="min(960px, 92vw)"
        maxHeight="90vh"
        purpose="info"
      >
        <DialogHeader
          title={activeVideo?.title ?? ''}
          subtitle={activeVideo?.description}
          onOpenChange={() => setActiveVideo(null)}
        />
        {activeVideo ? (
          <VStack padding={4}>
            <VStack xstyle={styles.player}>
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  {...stylex.props(styles.frame)}
                />
              </AspectRatio>
            </VStack>
          </VStack>
        ) : null}
      </Dialog>
    </VStack>
  );
}
