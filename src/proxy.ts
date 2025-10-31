import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

// Utility: check if user has any allowed role
function hasRole(userRoles: string[] | undefined, allowedRoles: string[]) {
    if (!userRoles || userRoles.length === 0) return false;
    return userRoles.some((role) => allowedRoles.includes(role.toLowerCase()));
}

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const url = req.nextUrl.clone();
        const path = req.nextUrl.pathname;

        // Redirect unauthenticated users
        if (!token?.user) {
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        const userRoles: string[] = token.user.roles || [];

        // Admin-only routes
        if (path.startsWith("/dashboard/roles") || path.startsWith("/dashboard/permissions")) {
            if (!hasRole(userRoles, ["admin"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // Shared dashboard access: Admin, Manager, Editor
        if (path.startsWith("/dashboard")) {
            if (!hasRole(userRoles, ["admin", "manager", "editor"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // Optionally, restrict /admin routes (if you still use them)
        if (path.startsWith("/admin")) {
            if (!hasRole(userRoles, ["admin"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        // All checks passed
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
