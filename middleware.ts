import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const verified = request.cookies.get("avdb_age_verified");
    if (verified) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
