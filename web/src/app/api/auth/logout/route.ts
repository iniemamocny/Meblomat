import { NextResponse } from 'next/server';
import { destroySession } from '@/server/auth';

export const runtime = 'nodejs';

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
