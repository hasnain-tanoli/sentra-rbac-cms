import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  title: string;
  key: string;
  description?: string;
  is_system?: boolean;
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
    match: /^[a-z0-9_]+$/
  },
  description: {
    type: String,
    default: ""
  },
  is_system: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

RoleSchema.pre('save', async function (next) {
  if (!this.key || this.isModified('title')) {
    const keyify = (str: string) => str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const baseKey = keyify(this.title);
    const Model = this.constructor as mongoose.Model<IRole>;

    let count = 0;
    let uniqueKey = baseKey;

    while (await Model.findOne({ key: uniqueKey, _id: { $ne: this._id } })) {
      count++;
      uniqueKey = `${baseKey}_${count}`;
    }

    this.key = uniqueKey;
  }
  next();
});

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);