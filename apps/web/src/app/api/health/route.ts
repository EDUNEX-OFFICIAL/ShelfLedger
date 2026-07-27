import { NextResponse } from 'next/server';
import { prisma } from '@shelfledger/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === '1' || url.searchParams.get('deep') === 'true';

  const payload: {
    success: true;
    data: {
      status: 'ok' | 'degraded';
      service: string;
      timestamp: string;
      database?: 'up' | 'down';
    };
  } = {
    success: true,
    data: {
      status: 'ok',
      service: 'shelfledger-web',
      timestamp: new Date().toISOString(),
    },
  };

  if (deep) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      payload.data.database = 'up';
    } catch {
      payload.data.database = 'down';
      payload.data.status = 'degraded';
      return NextResponse.json(payload, { status: 503 });
    }
  }

  return NextResponse.json(payload);
}
