import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUserPermissions } from "@/lib/rbac/getUserPermissions";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";
import { FileText, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { connectDB } from "@/lib/db/connection";
import { Post as PostModel } from "@/lib/db/models/post.model";

export const dynamic = "force-dynamic";

async function getPosts(): Promise<Post[]> {
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

export default async function HomePage() {
  const allPosts = await getPosts();
  const latestPosts = allPosts.slice(0, 6);

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  let hasOnlyPostsRead = false;
  let canAccessDashboard = false;

  if (isLoggedIn && session.user?.id) {
    const permissions = await getUserPermissions(session.user.id);

    hasOnlyPostsRead =
      permissions.length === 1 && permissions[0].key === "posts.read";

    const isAdmin = session.user.roles?.includes("admin");

    console.log("Is Admin:", isAdmin);

    const hasDashboardPermission = permissions.some(
      (p) =>
        p.key === "posts.create" ||
        p.key === "posts.update" ||
        p.key === "posts.delete" ||
        p.key === "users.read" ||
        p.key === "users.create" ||
        p.key === "users.update" ||
        p.key === "users.delete" ||
        p.key === "roles.read" ||
        p.key === "roles.create" ||
        p.key === "roles.update" ||
        p.key === "roles.delete" ||
        p.key === "permissions.read" ||
        p.key === "permissions.create" ||
        p.key === "permissions.update" ||
        p.key === "permissions.delete"
    );

    console.log("Has Dashboard Permission:", hasDashboardPermission);

    canAccessDashboard = isAdmin || hasDashboardPermission;

    console.log("Can Access Dashboard:", canAccessDashboard);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
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
