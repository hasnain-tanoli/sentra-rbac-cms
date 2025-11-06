// middleware.ts
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

        // Check if user is authenticated
        if (!token?.user?.id) {
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        const userId = token.user.id;

        // Route-specific permission checks
        try {
            // Roles management routes - requires roles:read or roles:update permission
            if (path.startsWith("/dashboard/roles")) {
                const canReadRoles = await hasPermission(userId, "roles", "read");
                const canUpdateRoles = await hasPermission(userId, "roles", "update");

                if (!canReadRoles && !canUpdateRoles) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            // Permissions management routes - requires permissions:read permission
            if (path.startsWith("/dashboard/permissions")) {
                const canReadPermissions = await hasPermission(userId, "permissions", "read");

                if (!canReadPermissions) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            // Users management routes - requires users:read permission
            if (path.startsWith("/dashboard/users")) {
                const canReadUsers = await hasPermission(userId, "users", "read");

                if (!canReadUsers) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            // Posts management routes - requires posts permissions
            if (path.startsWith("/dashboard/posts")) {
                const canReadPosts = await hasPermission(userId, "posts", "read");
                const canCreatePosts = await hasPermission(userId, "posts", "create");

                if (!canReadPosts && !canCreatePosts) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            // General dashboard access - requires at least one permission
            if (path.startsWith("/dashboard")) {
                const hasAccess = await hasDashboardAccess(userId);

                if (!hasAccess) {
                    url.pathname = "/unauthorized";
                    return NextResponse.redirect(url);
                }
            }

            return NextResponse.next();
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
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};