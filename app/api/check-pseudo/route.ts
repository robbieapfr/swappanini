import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const pseudo = request.nextUrl.searchParams.get('pseudo')?.trim()

  if (!pseudo || pseudo.length < 3) {
    return NextResponse.json({ available: false })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('pseudo')
    .eq('pseudo', pseudo)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
