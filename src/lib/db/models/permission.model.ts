import mongoose, { Schema, Document, Model } from 'mongoose';

// Central source of truth
export const RESOURCES = ['users', 'roles', 'permissions', 'posts', 'dashboard'] as const;
export type Resource = typeof RESOURCES[number];

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type Action = typeof ACTIONS[number];

export interface IPermission extends Document {
  key: string;
  resource: Resource;
  action: Action;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true, index: true },
    resource: { type: String, enum: RESOURCES, required: true, index: true },
    action: { type: String, enum: ACTIONS, required: true, index: true },
    description: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Optional compound index; uniqueness is enforced by `key`
PermissionSchema.index({ resource: 1, action: 1 });

export const Permission: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);