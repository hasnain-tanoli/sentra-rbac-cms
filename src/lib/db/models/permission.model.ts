// lib/db/models/Permission.ts
import mongoose, { Schema, Document } from 'mongoose';

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export const RESOURCES = ['users', 'posts', 'roles', 'permissions'] as const;

export type Action = typeof ACTIONS[number];
export type Resource = typeof RESOURCES[number];

export interface IPermission extends Document {
  resource: Resource;
  action: Action;
  key: string;
  description: string;
  created_at: Date;
}

const PermissionSchema = new Schema<IPermission>({
  resource: {
    type: String,
    required: true,
    enum: RESOURCES,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ACTIONS,
    index: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

PermissionSchema.pre('save', function (next) {
  this.key = `${this.resource}_${this.action}`;
  if (!this.description) {
    this.description = `${this.action.toUpperCase()} ${this.resource}`;
  }
  next();
});

export const Permission = mongoose.models.Permission ||
  mongoose.model<IPermission>('Permission', PermissionSchema);