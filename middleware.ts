import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/session";

const protectedRoutes = ["/", "/patients", "/admin", "/doctor", "/appointments", "/billing", "/superadmin", "/settings"];

const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );
  const isPublicRoute = publicRoutes.includes(path);

  const session = await getSession();

  // Not logged in
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Already logged in
  if (isPublicRoute && session) {
    let redirectPath = "/";

    if (session.role === "SUPERADMIN") redirectPath = "/superadmin";
    else if (session.role === "ADMIN") redirectPath = "/";
    else if (session.role === "DOCTOR") redirectPath = "/doctor";
    else if (session.role === "RECEPTIONIST") redirectPath = "/";

    return NextResponse.redirect(new URL(redirectPath, req.nextUrl));
  }

  // Superadmin only
  if (path.startsWith("/superadmin") && session?.role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Admin only
  if (path.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Doctor only
  if (
    path.startsWith("/doctor") &&
    !["DOCTOR", "ADMIN", "SUPERADMIN"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Billing: only admin + receptionist
  if (
    path.startsWith("/billing") &&
    !["ADMIN", "RECEPTIONIST", "SUPERADMIN"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Appointments: only admin + receptionist
  if (
    path.startsWith("/appointments") &&
    !["ADMIN", "RECEPTIONIST", "SUPERADMIN"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Settings: only admin + receptionist + superadmin
  if (
    path.startsWith("/settings") &&
    !["ADMIN", "RECEPTIONIST", "SUPERADMIN"].includes(session?.role || "")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
