import { z } from "zod";

export const signupSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 3 characters long")
        .max(50, "Name cannot exceed 50 characters"),
    email: z.email("Invalid email format"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;