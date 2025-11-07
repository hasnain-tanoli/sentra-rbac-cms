import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
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

async function getUserPermissions(email: string): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/users?email=${email}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.success && data.data?.permissions) {
      return data.data.permissions.map((p: { key: string }) => p.key);
    }
    return [];
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
}

export default async function HomePage() {
  const allPosts = await getPosts();
  const latestPosts = allPosts.slice(0, 6);

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Check user permissions
  let hasOnlyPostsRead = false;
  let canAccessDashboard = false;

  if (isLoggedIn && session.user.email) {
    const permissions = await getUserPermissions(session.user.email);
    hasOnlyPostsRead =
      permissions.length === 1 && permissions[0] === "posts.read";

    // User can access dashboard if they have any management permissions
    canAccessDashboard = permissions.some(
      (p) =>
        p === "posts.create" ||
        p === "posts.update" ||
        p === "posts.delete" ||
        p === "users.read" ||
        p === "users.create" ||
        p === "users.update" ||
        p === "users.delete" ||
        p === "roles.read" ||
        p === "roles.create" ||
        p === "roles.update" ||
        p === "roles.delete" ||
        p === "permissions.read" ||
        p === "permissions.create" ||
        p === "permissions.update" ||
        p === "permissions.delete"
    );
  }

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

          {/* Conditional CTAs based on auth status and permissions */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            {!isLoggedIn ? (
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Log In
                  </Button>
                </Link>
              </>
            ) : hasOnlyPostsRead ? (
              <Link href="/posts">
                <Button size="lg" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View All Posts
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : canAccessDashboard ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <p className="text-muted-foreground">
                Contact an administrator for access.
              </p>
            )}
          </div>
        </section>

        {/* Posts Section */}
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
            {allPosts.length > 6 && (
              <Link href="/posts">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {latestPosts.length === 0 ? (
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-16 text-center">
                <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground/20" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {!isLoggedIn
                    ? "Be the first to create content on this platform."
                    : "Check back soon for new content!"}
                </p>
                {!isLoggedIn && (
                  <Link href="/auth/signup">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                )}
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
