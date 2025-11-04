import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

function hasRole(userRoles: string[] | undefined, allowedRoles: string[]) {
    if (!userRoles || userRoles.length === 0) return false;
    return userRoles.some((role) => allowedRoles.includes(role));
}

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const url = req.nextUrl.clone();
        const path = req.nextUrl.pathname;

        if (!token?.user) {
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        const userRoles: string[] = token.user.roles || [];

        if (path.startsWith("/dashboard/roles") || path.startsWith("/dashboard/permissions")) {
            if (!hasRole(userRoles, ["super_admin"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        if (path.startsWith("/dashboard")) {
            if (!hasRole(userRoles, ["super_admin", "editor", "author"])) {
                url.pathname = "/unauthorized";
                return NextResponse.redirect(url);
            }
        }

        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};