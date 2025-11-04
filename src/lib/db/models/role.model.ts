// lib/db/models/Role.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  title: string;
  key: string;
  description?: string;
  is_system: boolean;
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
    required: true, 
    unique: true,
    lowercase: true,
    index: true,
    match: /^[a-z_]+$/
  },
  description: String,
  is_system: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

RoleSchema.pre('save', async function(next) {
  if (this.isNew && !this.key) {
    const keyify = (str: string) => str
      .toLowerCase()
      .replace(/[^a-z]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    const key = keyify(this.title);
    const Model = this.constructor as mongoose.Model<IRole>;
    
    let count = 0;
    let uniqueKey = key;
    while (await Model.findOne({ key: uniqueKey, _id: { $ne: this._id } })) {
      count++;
      uniqueKey = `${key}_${count}`;
    }
    
    this.key = uniqueKey;
  }
  next();
});

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);