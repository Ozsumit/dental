import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/session";

const protectedRoutes = ["/", "/admin", "/doctor", "/appointments", "/billing"];

const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const session = await getSession();

  // Not logged in
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Already logged in
  if (isPublicRoute && session) {
    let redirectPath = "/";

    if (session.role === "ADMIN") redirectPath = "/admin";
    if (session.role === "DOCTOR") redirectPath = "/doctor";
    if (session.role === "RECEPTIONIST") redirectPath = "/";

    return NextResponse.redirect(new URL(redirectPath, req.nextUrl));
  }

  // Admin only
  if (path.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Doctor only
  if (
    path.startsWith("/doctor") &&
    !["DOCTOR", "ADMIN"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Billing: only admin + receptionist
  if (
    path.startsWith("/billing") &&
    !["ADMIN", "RECEPTIONIST"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Appointments: only admin + receptionist
  if (
    path.startsWith("/appointments") &&
    !["ADMIN", "RECEPTIONIST"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
