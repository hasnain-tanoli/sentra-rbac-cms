import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";
import { FileText, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

    return publishedPosts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function HomePage() {
  const allPosts = await getPosts();

  const latestPosts = allPosts.slice(0, 6);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Modern CMS Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Sentra
            </span>
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            A clean, modern, and role-based CMS built with Next.js and
            TypeScript. Manage your content seamlessly with RBAC architecture.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                View Dashboard
              </Button>
            </Link>
          </div>
        </section>

        <section className="w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-7 w-7" />
                Latest Posts
              </h2>
              <p className="text-muted-foreground mt-2">
                Explore our latest articles and updates
              </p>
            </div>
            {allPosts.length > 0 && (
              <Link href="/posts">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {latestPosts.length === 0 ? (
            <div className="rounded-md border">
              <div className="px-4 py-16 text-center">
                <FileText className="h-16 w-16 mx-auto mb-6 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Be the first to create content on this platform.{" "}
                  <Link
                    href="/login"
                    className="text-primary font-medium hover:underline"
                  >
                    Log in
                  </Link>{" "}
                  to get started.
                </p>
                <Link href="/login">
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>

              {allPosts.length > 6 && (
                <div className="text-center pt-8">
                  <Link href="/posts">
                    <Button size="lg" variant="outline" className="gap-2">
                      View All Posts
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
