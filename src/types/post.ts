export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  author_id: {
    _id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}