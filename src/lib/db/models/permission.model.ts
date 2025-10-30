import mongoose, { Schema, Document, Model } from "mongoose";

export type PermissionAction = "create" | "read" | "update" | "delete";

export interface IPermission extends Document {
  resource: string;
  actions: PermissionAction[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    resource: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      lowercase: true,
    },
    actions: {
      type: [String],
      enum: ["create", "read", "update", "delete"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "At least one action is required",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
  },
  { timestamps: true }
);

export const Permission: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>("Permission", permissionSchema);
