import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/session";

const protectedRoutes = ["/", "/admin", "/doctor", "/appointments", "/billing"];
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const session = await getSession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session) {
    let redirectPath = "/";
    if (session.role === "ADMIN") redirectPath = "/admin";
    if (session.role === "DOCTOR") redirectPath = "/doctor";
    if (session.role === "RECEPTIONIST") redirectPath = "/";
    return NextResponse.redirect(new URL(redirectPath, req.nextUrl));
  }

  // Role based access
  if (path.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (path.startsWith("/doctor") && session?.role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (path.startsWith("/billing") && session?.role === "DOCTOR") {
    return NextResponse.redirect(new URL("/doctor", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
