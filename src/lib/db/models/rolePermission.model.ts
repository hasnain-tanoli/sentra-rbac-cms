// lib/db/models/RolePermission.ts
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
    index: true
  },
  permission_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Permission',
    required: true,
    index: true
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false } 
});

RolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

RolePermissionSchema.index({ permission_id: 1 });

export const RolePermission = mongoose.models.RolePermission || 
  mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);