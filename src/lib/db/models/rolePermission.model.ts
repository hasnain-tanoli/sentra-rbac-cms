// lib/db/models/rolePermission.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRolePermission extends Document {
  role_id: mongoose.Types.ObjectId;
  permission_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>({
  role_id: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    // Remove index: true from here since we define compound index below
  },
  permission_id: {
    type: Schema.Types.ObjectId,
    ref: 'Permission',
    required: true,
    // Remove index: true from here
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Compound unique index
RolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

// Single index on permission_id for lookups (keep only this one)
RolePermissionSchema.index({ permission_id: 1 });

// Add index on role_id for role lookups
RolePermissionSchema.index({ role_id: 1 });

export const RolePermission = mongoose.models.RolePermission ||
  mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);