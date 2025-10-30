export interface Post {
  _id: string;
  title: string;
  content: string;
  author_id: {
    _id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}
