import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRolePermission extends Document {
  role_id: Types.ObjectId;
  permission_id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role reference is required"],
    },
    permission_id: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: [true, "Permission reference is required"],
    },
  },
  { timestamps: true }
);

rolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

export const RolePermission: Model<IRolePermission> =
  mongoose.models.RolePermission ||
  mongoose.model<IRolePermission>("RolePermission", rolePermissionSchema);
