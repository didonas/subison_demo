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
  // Match only internationalized and admin pathnames, excluding static assets and internal endpoints
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
