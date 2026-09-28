import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { useOperationsStatusQuery } from '../hooks/use-operations-status-query.js';

const labels = {
  local: 'Sao lưu tại máy chủ',
  smb: 'Bản sao ngoài máy chủ',
  restore: 'Khôi phục thử',
};
const states = {
  healthy: 'Đã xác minh',
  stale: 'Quá hạn',
  unknown: 'Chưa có kết quả',
  error: 'Có lỗi',
};

export function OperationsStatus() {
  const query = useOperationsStatusQuery();
  if (query.isPending)
    return <Text>Đang tải trạng thái sao lưu tự động...</Text>;
  if (query.isError)
    return (
      <Banner status="error" title="Không thể tải trạng thái sao lưu tự động" />
    );
  return (
    <Grid columns={{ minWidth: 240, max: 3 }} gap={3}>
      {
        /** @type {('local' | 'smb' | 'restore')[]} */ ([
          'local',
          'smb',
          'restore',
        ]).map((key) => {
          const operation = query.data[key];
          return (
            <Card key={key} padding={4} xstyle={styles.card}>
              <VStack gap={2} hAlign="stretch">
                <Text weight="semibold">{labels[key]}</Text>
                <HStack gap={2} vAlign="center">
                  <StatusDot
                    variant={
                      operation.status === 'healthy'
                        ? 'success'
                        : operation.status === 'error'
                          ? 'error'
                          : 'warning'
                    }
                    label={states[operation.status]}
                  />
                  <Text weight="bold">{states[operation.status]}</Text>
                </HStack>
                <Text size="sm" color="secondary">
                  Thành công gần nhất:{' '}
                  {operation.lastSuccessUtc
                    ? new Date(operation.lastSuccessUtc).toLocaleString('vi-VN')
                    : 'Chưa có'}
                </Text>
              </VStack>
            </Card>
          );
        })
      }
    </Grid>
  );
}

const styles = stylex.create({
  card: {
    borderRadius: 'var(--meta-radius-inset)',
    boxShadow: 'var(--meta-shadow-card)',
  },
});
