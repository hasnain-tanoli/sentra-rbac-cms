import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  author_id: mongoose.Types.ObjectId;
  status: 'draft' | 'published';
  created_at: Date;
  updated_at: Date;
}

const PostSchema = new Schema<IPost>({
  title: { 
    type: String, 
    required: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    index: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  author_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'],
    default: 'draft',
    index: true 
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

PostSchema.index({ author_id: 1, status: 1, created_at: -1 });

PostSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('title')) {
    const slugify = (str: string) => str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const slug = slugify(this.title);
    const Model = this.constructor as mongoose.Model<IPost>;
    
    let count = 0;
    let uniqueSlug = slug;
    while (await Model.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
      count++;
      uniqueSlug = `${slug}-${count}`;
    }
    
    this.slug = uniqueSlug;
  }
  next();
});

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);