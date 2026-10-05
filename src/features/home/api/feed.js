import { apiRequest } from '@/shared/api/api-client.js';

export async function getHomeFeed() {
  const result = await apiRequest('/api/v1/home', {
    errorMessage: 'Không thể tải bản tin hôm nay',
  });
  if (!result.success) throw new Error(result.message);
  return /** @type {import('../types/feed.js').HomeFeed} */ (result.data);
}
