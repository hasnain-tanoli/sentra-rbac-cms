// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connection";
// import { User } from "@/lib/db/models";
// import bcrypt from "bcryptjs";
// import { loginSchema } from "@/lib/validators/login";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const parsed = loginSchema.safeParse(body);
//     if (!parsed.success) {
//       const errors = parsed.error.issues.map(issue => ({
//         field: issue.path.join("."),
//         message: issue.message,
//       }));
//       return NextResponse.json({ success: false, errors }, { status: 400 });
//     }

//     const { email, password } = parsed.data;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "Invalid email or password" },
//         { status: 401 }
//       );
//     }

//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) {
//       return NextResponse.json(
//         { success: false, message: "Invalid email or password" },
//         { status: 401 }
//       );
//     }

//     // ✅ Successful login
//     const safeUser = {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//     };

//     return NextResponse.json(
//       { success: true, message: "Login successful", user: safeUser },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
