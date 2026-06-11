import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
})

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/collection', '/wants', '/playground', '/inbox', '/profile']

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix before checking
  const withoutLocale = pathname.replace(/^\/(en|fr|es|de)/, '') || '/'
  return PROTECTED_PATHS.some((p) => withoutLocale === p || withoutLocale.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Run i18n routing first
  const intlResponse = intlMiddleware(request)

  if (!isProtectedPath(pathname)) {
    return intlResponse
  }

  // Auth guard for protected routes
  const response = intlResponse ?? NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = pathname.split('/')[1] ?? defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
