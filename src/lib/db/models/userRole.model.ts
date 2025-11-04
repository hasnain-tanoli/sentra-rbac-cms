import mongoose, { Schema, Document } from 'mongoose';

export interface IUserRole extends Document {
  user_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const UserRoleSchema = new Schema<IUserRole>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role_id: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

UserRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

UserRoleSchema.index({ role_id: 1 });

export const UserRole = mongoose.models.UserRole ||
  mongoose.model<IUserRole>('UserRole', UserRoleSchema);