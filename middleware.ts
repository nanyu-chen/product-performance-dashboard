import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdgeSync } from './src/lib/auth-edge'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Protect product-dashboard route
  if (request.nextUrl.pathname.startsWith('/product-dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const tokenValid = verifyTokenEdgeSync(token)
    if (!tokenValid) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Redirect to product-dashboard if already logged in and trying to access login
  if (request.nextUrl.pathname === '/login' && token) {
    const tokenValid = verifyTokenEdgeSync(token)
    if (tokenValid) {
      return NextResponse.redirect(new URL('/product-dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Redirect root to login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
