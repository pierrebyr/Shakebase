import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(new URL('/admin', request.url), { status: 303 })
}
