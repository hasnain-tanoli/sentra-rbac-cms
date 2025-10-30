import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/db/models/user.model";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export interface TokenUser {
    id: string;
    name?: string | null;
    email?: string | null;
    roles: string[]; // only string[] to match NextAuth expected types
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials): Promise<TokenUser | null> {
                if (!credentials?.email || !credentials.password) return null;

                const user = await User.findOne({ email: credentials.email }).lean();
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    roles: user.roles || [], // string[] ✅
                };
            },
        }),
    ],

    callbacks: {
        // Include user data in JWT
        async jwt({ token, user }: { token: JWT & { user?: TokenUser }; user?: TokenUser }) {
            if (user) {
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                };
            }
            return token;
        },

        // Include user data in session
        async session({ session, token }: { session: Session; token: JWT & { user?: TokenUser } }) {
            if (token.user) {
                session.user = {
                    id: token.user.id,
                    name: token.user.name,
                    email: token.user.email,
                    roles: token.user.roles,
                    image: session.user?.image ?? null,
                };
            }
            return session;
        },

        // Redirect after login
        async redirect({ url, baseUrl }) {
            if (url.startsWith(baseUrl)) return url;
            return `${baseUrl}/dashboard`;
        },
    },

    pages: {
        signIn: "/auth/login",
    },

    session: {
        strategy: "jwt", // JWT-based session
    },
};
