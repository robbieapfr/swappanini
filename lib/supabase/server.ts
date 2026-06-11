import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

function makeCookieHandlers(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        })
      } catch {
        // Called from a Server Component — middleware handles session refresh.
      }
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: makeCookieHandlers(cookieStore) }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: makeCookieHandlers(cookieStore) }
  )
}
