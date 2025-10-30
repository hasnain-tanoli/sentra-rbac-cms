import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators/signup";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user.model";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        // ✅ Validate input using Zod
        const parsed = signupSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return NextResponse.json({ success: false, errors }, { status: 400 });
        }

        const { name, email, password } = parsed.data;

        // ✅ Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists." },
                { status: 409 }
            );
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Create user with default role
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            roles: ["admin"], // 👈 Assign default role
        });

        // ✅ Return safe user object (no password)
        return NextResponse.json(
            {
                success: true,
                message: "User registered successfully.",
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error." },
            { status: 500 }
        );
    }
}
