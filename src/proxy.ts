import { auth } from "@/auth";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isAuthPage = req.nextUrl.pathname.startsWith('/admin/login');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

  if (isAdminPage && !isAuthPage && !req.auth) {
    const loginUrl = new URL('/admin/login', req.url);
    return Response.redirect(loginUrl);
  }

  // Apply i18n routing to non-admin public routes
  if (!isAdminPage) {
    return intlMiddleware(req);
  }
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
