import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — server-side only.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Resolve a user's email from auth.users via the service-role key */
export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data?.user?.email) return null
  return data.user.email
}
