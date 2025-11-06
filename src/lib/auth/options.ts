import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/db/models/user.model";
import { UserRole } from "@/lib/db/models/userRole.model";
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

type TokenUser = {
    id: string;
    name: string;
    email: string;
    roles: string[];
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.roles = (user as TokenUser).roles;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    name: token.name as string | null,
                    email: token.email as string | null,
                    image: session.user?.image ?? null,
                    roles: token.roles as string[],
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

    secret: process.env.NEXTAUTH_SECRET,
};