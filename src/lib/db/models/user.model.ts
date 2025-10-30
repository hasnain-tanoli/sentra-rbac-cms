import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: string;           // string for compatibility with NextAuth
  name: string;
  email: string;
  password: string;
  roles: string[];       // array of role IDs or role names
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      match: [/^[A-Za-z ]+$/, "Name must contain only alphabets and spaces"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    roles: {
      type: [String],
      default: [], // default to empty roles
    },
  },
  { timestamps: true }
);

// This ensures mongoose uses existing model if already compiled
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
