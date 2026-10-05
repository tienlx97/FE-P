import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { goldMillions } from '../config/gold.js';
import { newsTime, weatherLabel } from '../config/weather.js';

const styles = stylex.create({
  forecasts: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  prices: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});
/** @param {{weather:import('../types/feed.js').Weather|null}} props */
export function WeatherPanel({ weather }) {
  return (
    <VStack gap={4}>
      <Text type="supporting">TP. Hồ Chí Minh</Text>
      {weather ? (
        <>
          <HStack gap={4} wrap="wrap" align="center">
            <Text type="display-3" hasTabularNumbers>
              {Math.round(weather.temperature)}°C
            </Text>
            <VStack gap={1}>
              <Text weight="semibold">{weatherLabel(weather.code)}</Text>
              <Text type="supporting">
                Độ ẩm {weather.humidity}% · Gió {weather.windSpeed} km/h
              </Text>
            </VStack>
          </HStack>
          <Grid gap={3} xstyle={styles.forecasts}>
            {weather.days.map((day) => (
              <VStack key={day.date} gap={2} xstyle={styles.region}>
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
      <Button
        as="a"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size="sm"
        label="Nguồn: Open-Meteo ↗"
      />
    </VStack>
  );
}
/** @param {{gold:import('../types/feed.js').Gold|null}} props */
export function GoldPanel({ gold }) {
  return (
    <VStack gap={4}>
      <Text type="supporting">TP. Hồ Chí Minh · Triệu đồng/lượng</Text>
      {gold ? (
        gold.quotes.map((quote) => (
          <VStack key={quote.name} gap={2}>
            <Text type="label">Vàng {quote.name}</Text>
            <Grid gap={4} xstyle={styles.prices}>
              <VStack gap={1} xstyle={styles.region}>
                <Text type="supporting">Mua vào</Text>
                <Text size="2xl" weight="semibold" hasTabularNumbers>
                  {goldMillions(quote.buy)}
                </Text>
              </VStack>
              <VStack gap={1} xstyle={styles.region}>
                <Text type="supporting">Bán ra</Text>
                <Text size="2xl" weight="semibold" hasTabularNumbers>
                  {goldMillions(quote.sell)}
                </Text>
              </VStack>
            </Grid>
            <Text type="supporting">
              Niêm yết lúc {newsTime(quote.updatedAt)}
            </Text>
          </VStack>
        ))
      ) : (
        <Text color="secondary">
          Chưa tải được giá vàng. Hãy thử làm mới bản tin.
        </Text>
      )}
      <Button
        as="a"
        href={gold?.sourceUrl ?? 'https://giavang.pnj.com.vn/'}
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size="sm"
        label="Giá niêm yết bởi PNJ ↗"
      />
    </VStack>
  );
}
