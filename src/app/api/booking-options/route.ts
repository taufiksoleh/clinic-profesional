import { getPublicSchedules } from '@/server/content/queries'
export async function GET() {
  return Response.json(await getPublicSchedules(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
