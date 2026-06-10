import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { pickLocale, isLocale } from '@/i18n/locales'

function ensureLocaleCookie(request: NextRequest, response: NextResponse) {
  const current = request.cookies.get('NEXT_LOCALE')?.value
  if (!isLocale(current)) {
    const locale = pickLocale(request.headers.get('accept-language'))
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' })
  }
  return response
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/api/demo-request') ||
    pathname.startsWith('/tarifs') ||
    pathname.startsWith('/fonctionnalites') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/api/contact') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/v1') ||
    pathname.startsWith('/api/health')

  if (!user && !isPublic) {
    return ensureLocaleCookie(request, NextResponse.redirect(new URL('/login', request.url)))
  }

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  if (user && isAuthRoute) {
    return ensureLocaleCookie(request, NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return ensureLocaleCookie(request, supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
