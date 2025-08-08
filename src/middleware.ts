import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path starts with a gym slug (not a known route)
  const knownRoutes = ['/dashboard', '/content', '/approvals', '/api', '/_next', '/favicon.ico', '/onboarding', '/settings']
  const isKnownRoute = knownRoutes.some(route => pathname.startsWith(route))

  if (!isKnownRoute && pathname !== '/' && pathname !== '') {
    // Extract gym slug from the pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const gymSlug = pathSegments[0]
    
    // Check if it looks like a gym slug (contains letters/numbers, no special chars except hyphens)
    if (/^[a-zA-Z0-9-]+$/.test(gymSlug)) {
      // Check if this is a valid gym slug by looking at the path structure
      const validGymPaths = ['', 'onboarding', 'settings']
      const subPath = pathSegments[1] || ''
      
      if (validGymPaths.includes(subPath)) {
        // This is a valid gym route, let it pass through
        return NextResponse.next()
      } else {
        // Redirect to the main gym page
        return NextResponse.redirect(new URL(`/${gymSlug}`, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
