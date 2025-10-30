import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole extends Document {
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const roleSchema = new Schema<IRole>(
  {
    title: {
      type: String,
      required: [true, "Role title is required"],
      unique: true,
      trim: true,
      minlength: [2, "Role title must be at least 2 characters"],
      maxlength: [50, "Role title cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
  },
  { timestamps: true }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", roleSchema);
