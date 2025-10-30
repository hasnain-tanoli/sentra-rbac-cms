import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/db/models/user.model";
import { TokenUser } from "@/types/tokenUser";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await User.findOne({ email: credentials.email });
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    roles: user.roles || [],
                };
            },
        }),
    ],

    callbacks: {
        async jwt({
            token,
            user,
        }: {
            token: JWT & { user?: TokenUser };
            user?: TokenUser;
        }) {
            if (user) {
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles ?? [],
                } satisfies TokenUser;
            }
            return token;
        },

        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT & { user?: TokenUser };
        }) {
            if (token.user) {
                session.user = {
                    id: token.user.id,
                    name: token.user.name,
                    email: token.user.email,
                    roles: token.user.roles ?? [],
                    image: session.user?.image ?? null,
                };
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            // If login is successful, send to dashboard
            if (url.startsWith(baseUrl)) return url;
            return `${baseUrl}/dashboard`;
        },
    },

    pages: {
        signIn: "/auth/login",
    },

    session: {
        strategy: "jwt", // ensures consistent session storage
    },
};
