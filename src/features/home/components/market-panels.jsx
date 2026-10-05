import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CloudSun, Coins } from 'lucide-react';

import { goldMillions } from '../config/gold.js';
import { newsTime, weatherLabel } from '../config/weather.js';

const styles = stylex.create({
  forecasts: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  prices: {
    alignItems: 'baseline',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)',
  },
  number: { textAlign: 'end' },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** @param {{icon:typeof CloudSun, title:string, meta:string}} props */
function PanelHeader({ icon, title, meta }) {
  return (
    <HStack gap={2} justify="between" align="center" wrap="wrap">
      <HStack gap={2} align="center">
        <Icon icon={icon} color="accent" />
        <Heading level={2}>{title}</Heading>
      </HStack>
      <Text type="supporting">{meta}</Text>
    </HStack>
  );
}

/** @param {{href:string, label:string}} props */
function SourceLink({ href, label }) {
  return (
    <Button
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="ghost"
      size="sm"
      label={label}
    />
  );
}

/** @param {{weather:import('../types/feed.js').Weather|null}} props */
export function WeatherPanel({ weather }) {
  return (
    <Card xstyle={styles.region}>
      <VStack gap={4}>
        <PanelHeader icon={CloudSun} title="Thời tiết" meta="TP. Hồ Chí Minh" />
        {weather ? (
          <>
            <HStack gap={4} wrap="wrap" align="center">
              <Text type="display-3" hasTabularNumbers>
                {Math.round(weather.temperature)}°C
              </Text>
              <VStack gap={1} xstyle={styles.region}>
                <Text weight="semibold">{weatherLabel(weather.code)}</Text>
                <Text type="supporting">
                  Độ ẩm {weather.humidity}% · Gió {weather.windSpeed} km/h
                </Text>
              </VStack>
            </HStack>
            <Divider />
            <Grid gap={3} xstyle={styles.forecasts}>
              {weather.days.map((day) => (
                <VStack key={day.date} gap={1} xstyle={styles.region}>
                  <Text type="label">
                    {new Intl.DateTimeFormat('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    }).format(new Date(day.date + 'T12:00:00+07:00'))}
                  </Text>
                  <Text hasTabularNumbers weight="semibold">
                    {Math.round(day.min)}–{Math.round(day.max)}°
                  </Text>
                  <Text type="supporting">Mưa {day.rainProbability}%</Text>
                </VStack>
              ))}
            </Grid>
            <Text type="supporting">
              Dữ liệu lúc {newsTime(weather.time + '+07:00')} (giờ Việt Nam)
            </Text>
          </>
        ) : (
          <Text color="secondary">
            Chưa tải được thời tiết. Hãy thử làm mới bản tin.
          </Text>
        )}
        <SourceLink
          href="https://open-meteo.com/"
          label="Nguồn: Open-Meteo ↗"
        />
      </VStack>
    </Card>
  );
}

/** @param {{gold:import('../types/feed.js').Gold|null}} props */
export function GoldPanel({ gold }) {
  return (
    <Card xstyle={styles.region}>
      <VStack gap={4}>
        <PanelHeader icon={Coins} title="Giá vàng" meta="Triệu đồng/lượng" />
        {gold ? (
          <VStack gap={3}>
            <Grid gap={3} xstyle={styles.prices}>
              <Text type="supporting">TP. Hồ Chí Minh</Text>
              <Text type="supporting" xstyle={styles.number}>
                Mua vào
              </Text>
              <Text type="supporting" xstyle={styles.number}>
                Bán ra
              </Text>
            </Grid>
            {gold.quotes.map((quote) => (
              <VStack key={quote.name} gap={3}>
                <Divider />
                <Grid gap={3} xstyle={styles.prices}>
                  <VStack gap={1} xstyle={styles.region}>
                    <Text weight="semibold">Vàng {quote.name}</Text>
                    <Text type="supporting">{newsTime(quote.updatedAt)}</Text>
                  </VStack>
                  <Text
                    size="lg"
                    weight="semibold"
                    hasTabularNumbers
                    xstyle={styles.number}
                  >
                    {goldMillions(quote.buy)}
                  </Text>
                  <Text
                    size="lg"
                    weight="semibold"
                    hasTabularNumbers
                    xstyle={styles.number}
                  >
                    {goldMillions(quote.sell)}
                  </Text>
                </Grid>
              </VStack>
            ))}
          </VStack>
        ) : (
          <Text color="secondary">
            Chưa tải được giá vàng. Hãy thử làm mới bản tin.
          </Text>
        )}
        <SourceLink
          href={gold?.sourceUrl ?? 'https://giavang.pnj.com.vn/'}
          label="Giá niêm yết bởi PNJ ↗"
        />
      </VStack>
    </Card>
  );
}
