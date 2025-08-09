import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and auth pages
  const skipRoutes = ['/api', '/_next', '/favicon.ico', '/login']
  const shouldSkip = skipRoutes.some(route => pathname.startsWith(route))
  
  if (shouldSkip) {
    return NextResponse.next()
  }

  // Check if this is an agency route (single segment, not gym specific)
  const pathSegments = pathname.split('/').filter(Boolean)
  
  if (pathSegments.length === 1 && /^[a-zA-Z0-9-]+$/.test(pathSegments[0])) {
    // This is an agency route like /gym-launch
    return NextResponse.next()
  }

  // Check if this is a gym-specific route that needs authentication
  if (pathSegments.length >= 1 && /^[a-zA-Z0-9-]+$/.test(pathSegments[0])) {
    const gymSlug = pathSegments[0]
    const subPath = pathSegments[1] || ''
    
    // Valid gym subpaths
    const validGymPaths = ['', 'onboarding', 'settings', 'connect']
    
    if (validGymPaths.includes(subPath) || subPath.startsWith('onboarding')) {
      // Check session for main dashboard access
      if (subPath === '' || subPath === 'settings') {
        const sessionToken = request.cookies.get('session_token')?.value || 
                           request.headers.get('authorization')?.replace('Bearer ', '')

        if (!sessionToken) {
          // No session, redirect to agency login
          const agencySlug = gymSlug.split('-')[0] || 'gym-launch'
          return NextResponse.redirect(new URL(`/${agencySlug}`, request.url))
        }

        try {
          // Verify session in database
          const { data: session, error } = await supabase
            .from('user_sessions')
            .select('expires_at')
            .eq('session_token', sessionToken)
            .single()

          if (error || !session || new Date(session.expires_at) < new Date()) {
            // Invalid or expired session
            const agencySlug = gymSlug.split('-')[0] || 'gym-launch'
            const response = NextResponse.redirect(new URL(`/${agencySlug}`, request.url))
            response.cookies.delete('session_token')
            return response
          }
        } catch (error) {
          console.error('Session validation error:', error)
          const agencySlug = gymSlug.split('-')[0] || 'gym-launch'
          return NextResponse.redirect(new URL(`/${agencySlug}`, request.url))
        }
      }
      
      return NextResponse.next()
    } else {
      // Invalid subpath, redirect to main gym page
      return NextResponse.redirect(new URL(`/${gymSlug}`, request.url))
    }
  }

  // For root path, redirect to a default agency
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/gym-launch', request.url))
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
