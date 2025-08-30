import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './src/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  console.log('🔵 Middleware - Path:', request.nextUrl.pathname)
  console.log('🔵 Middleware - Token exists:', !!token)

  // Protect product-dashboard route
  if (request.nextUrl.pathname.startsWith('/product-dashboard')) {
    console.log('🔵 Middleware - Protecting product-dashboard')
    
    if (!token) {
      console.log('❌ Middleware - No token, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const tokenValid = verifyToken(token)
    console.log('🔵 Middleware - Token valid:', !!tokenValid)
    
    if (!tokenValid) {
      console.log('❌ Middleware - Invalid token, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log('✅ Middleware - Token valid, allowing access')
  }

  // Redirect to product-dashboard if already logged in and trying to access login
  if (request.nextUrl.pathname === '/login' && token && verifyToken(token)) {
    console.log('🔵 Middleware - Already logged in, redirecting to dashboard')
    return NextResponse.redirect(new URL('/product-dashboard', request.url))
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
