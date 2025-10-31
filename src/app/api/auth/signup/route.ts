import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators/signup";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user.model";
import { Role } from "@/lib/db/models/role.model";
import { UserRole } from "@/lib/db/models/userRole.model";

export async function POST(req: Request) {
    try {
        await connectDB();

        // 1️⃣ Parse and validate
        const body = await req.json();
        const parsed = signupSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return NextResponse.json({ success: false, errors }, { status: 400 });
        }

        const { name, email, password } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        // 2️⃣ Prevent duplicates
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists." },
                { status: 409 }
            );
        }

        // 3️⃣ Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        // 4️⃣ Find and assign default role
        const defaultRole =
            (await Role.findOne({ title: "User" }))

        if (defaultRole) {
            await UserRole.create({
                user_id: user._id,
                role_id: defaultRole._id,
            });
            console.log(`✅ Assigned role "${defaultRole.title}" to ${user.email}`);
        } else {
            console.warn("⚠️ No default role found. Please seed the roles collection.");
        }

        // 5️⃣ Aggregate user with roles for dashboard
        const populatedUser = await User.aggregate([
            { $match: { _id: user._id } },
            {
                $lookup: {
                    from: "userroles",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "userRoles",
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "userRoles.role_id",
                    foreignField: "_id",
                    as: "roles",
                },
            },
            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    "roles.__v": 0,
                },
            },
        ]);

        // 6️⃣ Return complete response
        return NextResponse.json(
            {
                success: true,
                message: "User registered successfully.",
                user: populatedUser[0] || {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
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
