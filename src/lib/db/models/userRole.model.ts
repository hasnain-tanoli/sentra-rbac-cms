import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserRole extends Document {
  user_id: Types.ObjectId;
  role_id: Types.ObjectId;
  assignedAt?: Date;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role reference is required"],
    },
  },
  { timestamps: { createdAt: "assignedAt" } }
);

userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

export const UserRole: Model<IUserRole> =
  mongoose.models.UserRole || mongoose.model<IUserRole>("UserRole", userRoleSchema);
