import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import {
  colorVars,
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Coins,
  Droplets,
  Moon,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';

import { goldMillions } from '../config/gold.js';
import {
  hourLabel,
  isLikelyRain,
  newsTime,
  uvLabel,
  weatherLabel,
  weatherTone,
} from '../config/weather.js';

const styles = stylex.create({
  hour: {
    alignItems: 'center',
    borderRadius: radiusVars['--radius-container'],
    flexShrink: 0,
    minWidth: '3.25rem',
    paddingBlock: spacingVars['--spacing-2'],
  },
  hourNow: { backgroundColor: colorVars['--color-background-muted'] },
  rain: { color: colorVars['--color-text-blue'] },
  // Natural weather colours (see weatherTone); icon tokens adapt to dark mode.
  orange: { color: colorVars['--color-icon-orange'] },
  yellow: { color: colorVars['--color-icon-yellow'] },
  gray: { color: colorVars['--color-icon-gray'] },
  cyan: { color: colorVars['--color-icon-cyan'] },
  blue: { color: colorVars['--color-icon-blue'] },
  purple: { color: colorVars['--color-icon-purple'] },
  facts: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  forecasts: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  prices: {
    alignItems: 'baseline',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)',
  },
  number: { textAlign: 'end' },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** WMO weather code → icon; night variants where the sky is visible.
 * @param {number} code @param {boolean} [isDay] */
function weatherIcon(code, isDay = true) {
  if (code === 0) return isDay ? Sun : Moon;
  if ([1, 2].includes(code)) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  if (code >= 61) return CloudRain;
  return Cloud;
}

/** Text props that colour a likely-rain probability blue. `color="inherit"`
 * stops the supporting type's own colour from overriding the xstyle colour.
 * @param {number} probability */
function rainText(probability) {
  return isLikelyRain(probability)
    ? { color: /** @type {const} */ ('inherit'), xstyle: styles.rain }
    : {};
}

/** Condition icon in its natural colour.
 * @param {{code:number, isDay?:boolean, size?:'sm'|'md'|'lg', label?:string}} props */
function WeatherIcon({ code, isDay = true, size = 'md', label }) {
  return (
    <Icon
      icon={weatherIcon(code, isDay)}
      size={size}
      label={label}
      xstyle={styles[weatherTone(code, isDay)]}
    />
  );
}

/** @param {{icon:typeof CloudSun, title:string, meta:string, color?:'accent'|'warning'}} props */
function PanelHeader({ icon, title, meta, color = 'accent' }) {
  return (
    <HStack gap={2} justify="between" align="center" wrap="wrap">
      <HStack gap={2} align="center">
        <Icon icon={icon} color={color} />
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

/** @param {{icon:typeof Wind, label:string, value:string}} props */
function Fact({ icon, label, value }) {
  return (
    <HStack gap={2} align="center" xstyle={styles.region}>
      <Icon icon={icon} color="secondary" size="sm" />
      <VStack gap={0} xstyle={styles.region}>
        <Text type="supporting">{label}</Text>
        <Text weight="semibold" hasTabularNumbers>
          {value}
        </Text>
      </VStack>
    </HStack>
  );
}

/** @param {{hours:import('../types/feed.js').WeatherHour[]}} props */
function HourlyStrip({ hours }) {
  return (
    <VStack gap={2}>
      <Text type="label">12 giờ tới</Text>
      {/* Carousel supplies prev/next buttons, edge fades, snap and keyboard panning. */}
      <Carousel aria-label="Dự báo 12 giờ tới" gap={1} hasSnap>
        {hours.map((hour, index) => (
          <VStack
            key={hour.time}
            gap={1}
            xstyle={[styles.hour, index === 0 && styles.hourNow]}
          >
            <Text type="supporting">
              {index === 0 ? 'Bây giờ' : hourLabel(hour.time)}
            </Text>
            <WeatherIcon code={hour.code} label={weatherLabel(hour.code)} />
            <Text weight="semibold" hasTabularNumbers>
              {Math.round(hour.temperature)}°
            </Text>
            <Text
              type="supporting"
              hasTabularNumbers
              {...rainText(hour.rainProbability)}
            >
              {hour.rainProbability}%
            </Text>
          </VStack>
        ))}
      </Carousel>
    </VStack>
  );
}

/** @param {{weather:import('../types/feed.js').Weather|null}} props */
export function WeatherPanel({ weather }) {
  const uv = uvLabel(weather?.uvIndex);
  return (
    <Card xstyle={styles.region}>
      <VStack gap={4}>
        <PanelHeader icon={CloudSun} title="Thời tiết" meta="TP. Hồ Chí Minh" />
        {weather ? (
          <>
            <HStack gap={3} wrap="wrap" align="center">
              <WeatherIcon
                code={weather.code}
                isDay={weather.isDay}
                size="lg"
              />
              <Text type="display-3" hasTabularNumbers>
                {Math.round(weather.temperature)}°C
              </Text>
              <VStack gap={1} xstyle={styles.region}>
                <Text weight="semibold">{weatherLabel(weather.code)}</Text>
                {weather.apparentTemperature != null ? (
                  <Text type="supporting">
                    Cảm giác như {Math.round(weather.apparentTemperature)}°C
                  </Text>
                ) : null}
              </VStack>
            </HStack>
            <Grid gap={3} xstyle={styles.facts}>
              <Fact
                icon={Droplets}
                label="Độ ẩm"
                value={`${weather.humidity}%`}
              />
              <Fact
                icon={Wind}
                label="Gió"
                value={`${weather.windSpeed} km/h`}
              />
              {uv ? (
                <Fact
                  icon={Thermometer}
                  label="Chỉ số UV"
                  value={`${Math.round(weather.uvIndex ?? 0)} · ${uv}`}
                />
              ) : null}
              {weather.precipitation != null ? (
                <Fact
                  icon={Umbrella}
                  label="Lượng mưa"
                  value={`${weather.precipitation} mm`}
                />
              ) : null}
            </Grid>
            {weather.hours?.length ? (
              <HourlyStrip hours={weather.hours} />
            ) : null}
            <Divider />
            <Grid gap={3} xstyle={styles.forecasts}>
              {weather.days.map((day, index) => (
                <VStack key={day.date} gap={1} xstyle={styles.region}>
                  <Text type="label">
                    {index === 0
                      ? 'Hôm nay'
                      : new Intl.DateTimeFormat('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        }).format(new Date(day.date + 'T12:00:00+07:00'))}
                  </Text>
                  <HStack gap={1} align="center">
                    <WeatherIcon
                      code={day.code}
                      size="sm"
                      label={weatherLabel(day.code)}
                    />
                    <Text hasTabularNumbers weight="semibold">
                      {Math.round(day.min)}–{Math.round(day.max)}°
                    </Text>
                  </HStack>
                  <Text type="supporting" {...rainText(day.rainProbability)}>
                    Mưa {day.rainProbability}%
                  </Text>
                </VStack>
              ))}
            </Grid>
            <Text type="supporting">
              Dữ liệu lúc {newsTime(weather.time + '+07:00')} · cập nhật mỗi 15
              phút
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
    <Card variant="yellow" xstyle={styles.region}>
      <VStack gap={4}>
        <PanelHeader
          icon={Coins}
          title="Giá vàng"
          meta="Triệu đồng/lượng"
          color="warning"
        />
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
