import * as z from "zod";

export const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long."),
    email: z.email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters long."),
});

export type UserSchema = z.infer<typeof userSchema>;
