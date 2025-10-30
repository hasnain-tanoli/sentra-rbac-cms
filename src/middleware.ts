// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { token } = req.nextauth;

        // If no token, redirect to login
        if (!token) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        const path = req.nextUrl.pathname;
        const userRoles = token.user?.roles || [];

        // 🧠 Example: Protect /admin for only admins and managers
        if (path.startsWith("/admin")) {
            const allowed = ["admin", "manager"];
            if (!userRoles.some((role: string) => allowed.includes(role))) {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // 🧠 Example: Protect /dashboard for all authenticated users, but limit deeper sections
        if (path.startsWith("/dashboard/settings")) {
            if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // ✅ Otherwise, allow access
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // must be logged in
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
