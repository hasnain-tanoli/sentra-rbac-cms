import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home | Sentra",
  description: "Welcome to Sentra - Your content management system",
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

export default async function HomePage() {
  const posts = await getPosts();
  const recentPosts = posts.slice(0, 6);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        <section className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to Sentra
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your powerful role-based content management system
          </p>
        </section>

        {recentPosts.length > 0 && (
          <section className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FileText className="h-7 w-7" />
                  Recent Posts
                </h2>
                <p className="text-muted-foreground mt-2">
                  Check out our latest articles and updates
                </p>
              </div>
              {posts.length > 6 && (
                <Link href="/posts">
                  <Button variant="outline" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <div className="rounded-md border mt-8">
            <div className="px-4 py-24 text-center">
              <FileText className="h-16 w-16 mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There are currently no published posts to display. Check back
                soon for updates!
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
