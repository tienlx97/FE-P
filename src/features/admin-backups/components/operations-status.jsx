import { Banner } from '@astryxdesign/core/Banner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

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
    <VStack gap={2} hAlign="stretch">
      {
        /** @type {('local' | 'smb' | 'restore')[]} */ ([
          'local',
          'smb',
          'restore',
        ]).map((key) => {
          const operation = query.data[key];
          return (
            <Banner
              key={key}
              collapsible={false}
              status={
                operation.status === 'healthy'
                  ? 'success'
                  : operation.status === 'error'
                    ? 'error'
                    : 'warning'
              }
              title={`${labels[key]}: ${states[operation.status]}`}
            >
              <Text>
                Lần thành công gần nhất:{' '}
                {operation.lastSuccessUtc
                  ? new Date(operation.lastSuccessUtc).toLocaleString('vi-VN')
                  : 'Chưa có'}
              </Text>
            </Banner>
          );
        })
      }
    </VStack>
  );
}
