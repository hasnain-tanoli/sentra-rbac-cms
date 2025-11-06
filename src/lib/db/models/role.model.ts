// lib/db/models/role.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  title: string;
  key: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const RoleSchema = new Schema<IRole>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: false, // Changed to false since it's auto-generated
    unique: true,
    lowercase: true,
    index: true,
    match: /^[a-z_]+$/
  },
  description: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Pre-save hook to auto-generate key from title
RoleSchema.pre('save', async function (next) {
  // Always generate key if it doesn't exist or if title changed
  if (!this.key || this.isModified('title')) {
    const keyify = (str: string) => str
      .toLowerCase()
      .replace(/[^a-z]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const baseKey = keyify(this.title);
    const Model = this.constructor as mongoose.Model<IRole>;

    let count = 0;
    let uniqueKey = baseKey;

    // Ensure uniqueness by checking existing keys
    while (await Model.findOne({ key: uniqueKey, _id: { $ne: this._id } })) {
      count++;
      uniqueKey = `${baseKey}_${count}`;
    }

    this.key = uniqueKey;
  }
  next();
});

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);