import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/db/models/user.model";
import { UserRole } from "@/lib/db/models/userRole.model";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { TokenUser } from "@/types/auth";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";

type LeanUser = {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
};

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

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).lean<LeanUser>();
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                const userRoles = await UserRole.aggregate([
                    { $match: { user_id: new mongoose.Types.ObjectId(user._id) } },
                    {
                        $lookup: {
                            from: 'roles',
                            localField: 'role_id',
                            foreignField: '_id',
                            as: 'role'
                        }
                    },
                    { $unwind: '$role' },
                    {
                        $project: {
                            key: '$role.key',
                            title: '$role.title'
                        }
                    }
                ]);

                const roleKeys = userRoles.map(r => r.key);

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    roles: roleKeys,
                };
            },
        }),
    ],

    callbacks: {
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

        async redirect({ url, baseUrl }) {
            if (url.startsWith(baseUrl)) return url;
            return `${baseUrl}/dashboard`;
        },
    },

    pages: {
        signIn: "/auth/login",
    },

    session: {
        strategy: "jwt",
    },
};