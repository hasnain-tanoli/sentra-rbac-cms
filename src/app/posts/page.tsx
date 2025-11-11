import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Posts | Sentra",
  description:
    "Explore our complete collection of articles, updates, and insights.",
};

async function getPosts(): Promise<Post[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/posts`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch posts, status:", res.status);
      return [];
    }

    const data: { success: boolean; data: Post[] } = await res.json();

    const publishedPosts = (data.data || []).filter(
      (post) => post.status === "published"
    );

    return publishedPosts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function AllPostsPage() {
  const posts = await getPosts();

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        <section className="w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8" />
                All Posts
              </h1>
              <p className="text-muted-foreground mt-2">
                Explore our complete collection of articles and updates.
              </p>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="gap-2 self-start sm:self-center"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-md border mt-8">
              <div className="px-4 py-24 text-center">
                <FileText className="h-16 w-16 mx-auto mb-6 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No Posts Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There are currently no published posts to display. Please
                  check back later.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
