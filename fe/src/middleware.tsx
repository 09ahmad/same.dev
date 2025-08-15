// src/middleware.js
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request:NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next()
  }

  const publicRoutes = ['/', '/signin']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    console.log('Middleware - Path:', pathname, 'Token exists:', !!token)
    
    if (!token) {
      console.log('No session found, redirecting to /signin')
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    console.log('Session found for user:', token.email, 'allowing access to:', pathname)
    return NextResponse.next()

  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}