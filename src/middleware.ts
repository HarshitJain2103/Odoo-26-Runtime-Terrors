import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, logo.svg (public assets)
     */
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|logo\\.svg).*)",
  ],
};
