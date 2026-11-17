import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@bayou/supabase/middleware';

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'),
  );
}

export async function middleware(request: NextRequest) {
  // No session cookie means there is nothing to refresh. Skip getUser()
  // so an anonymous visit does not round-trip to Supabase Auth.
  if (!hasSupabaseAuthCookie(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  // getUser() validates with Supabase auth server and refreshes the cookie.
  // Client pages should use getSession() after this so they do not refresh again.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/members/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/members/feed', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/members/:path*'],
};
