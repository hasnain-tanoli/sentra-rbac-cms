import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import {
    hasPermission,
    hasDashboardAccess
} from "./lib/rbac/checkMiddlewarePermission";

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const url = req.nextUrl.clone();
        const path = req.nextUrl.pathname;

        if (!token?.id) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        const userId = token.id;

        try {
            if (path.startsWith("/dashboard/roles")) {
                const canReadRoles = await hasPermission(userId, "roles", "read");
                const canUpdateRoles = await hasPermission(userId, "roles", "update");

                if (!canReadRoles && !canUpdateRoles) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            if (path.startsWith("/dashboard/permissions")) {
                const canReadPermissions = await hasPermission(userId, "permissions", "read");

                if (!canReadPermissions) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            if (path.startsWith("/dashboard/users")) {
                const canReadUsers = await hasPermission(userId, "users", "read");

                if (!canReadUsers) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            if (path.startsWith("/dashboard/posts")) {
                const canReadPosts = await hasPermission(userId, "posts", "read");
                const canCreatePosts = await hasPermission(userId, "posts", "create");

                if (!canReadPosts && !canCreatePosts) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            if (path.startsWith("/dashboard")) {
                const hasAccess = await hasDashboardAccess(userId);

                if (!hasAccess) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            const response = NextResponse.next();
            response.headers.set('Cache-Control', 'no-store');
            return response;
        } catch (error) {
            console.error("Middleware permission check error:", error);
            url.pathname = "/error";
            return NextResponse.redirect(url);
        }
    },
    {
        pages: {
            signIn: "/auth/login",
        },
        callbacks: {
            authorized: ({ token }) => {
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};