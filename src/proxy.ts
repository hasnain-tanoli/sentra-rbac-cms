// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

// Helper function to check if user has at least one allowed role
function hasRole(userRoles: string[] | undefined, allowedRoles: string[]) {
    if (!userRoles) return false;
    return userRoles.some(role => allowedRoles.includes(role));
}

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const url = req.nextUrl.clone();
        const path = req.nextUrl.pathname;

        // If not logged in → redirect to login
        if (!token?.user) {
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        const userRoles = token.user.roles;

        // Admin pages
        if (path.startsWith("/admin")) {
            if (!hasRole(userRoles, ["admin", "manager"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // Dashboard settings pages
        if (path.startsWith("/dashboard/settings")) {
            if (!hasRole(userRoles, ["admin", "manager"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // Posts management
        if (path.startsWith("/dashboard/posts")) {
            if (!hasRole(userRoles, ["admin", "manager", "editor"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // Otherwise allow
        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
