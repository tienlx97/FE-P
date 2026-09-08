import { resolveApiBaseUrl } from '@/shared/config/api-config.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/health/ready`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
    if (!response.ok || (await response.text()).trim() !== 'Healthy') {
      throw new Error('Dependency unavailable');
    }
    return Response.json(
      { status: 'Healthy' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { status: 'Unhealthy' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
