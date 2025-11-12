import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";
import { FileText } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Post as PostModel } from "@/lib/db/models/post.model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Posts | Sentra",
  description:
    "Browse all published posts on Sentra - Your content management system",
};

async function getPublishedPosts(): Promise<Post[]> {
  try {
    await connectDB();

    const posts = await PostModel.find({ status: "published" })
      .populate("author_id", "name email")
      .sort({ created_at: -1 })
      .lean();

    return JSON.parse(JSON.stringify(posts)) as Post[];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

function HeroSection() {
  return (
    <section className="text-center space-y-4 mb-16">
      <h1 className="text-5xl font-bold tracking-tight">All Posts</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Explore our latest articles and insights
      </p>
    </section>
  );
}

function PostsHeader({ totalPosts }: { totalPosts: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-7 w-7" />
          Published Posts
        </h2>
        <p className="text-muted-foreground mt-2">
          {totalPosts} {totalPosts === 1 ? "article" : "articles"} available
        </p>
      </div>
    </div>
  );
}

function PostsGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-24 text-center">
        <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground/20" />
        <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          There are currently no published posts to display. Check back soon for
          updates!
        </p>
      </div>
    </div>
  );
}

function PostsSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="w-full space-y-8">
      <PostsHeader totalPosts={posts.length} />
      <PostsGrid posts={posts} />
    </section>
  );
}

export default async function PostsPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        <HeroSection />
        <PostsSection posts={posts} />
      </main>

      <Footer />
    </>
  );
}
