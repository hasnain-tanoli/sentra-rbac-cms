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

const DASHBOARD_PERMISSION_KEYS = [
  "posts.create",
  "posts.update",
  "posts.delete",
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "permissions.read",
  "permissions.create",
  "permissions.update",
  "permissions.delete",
] as const;

interface UserAccess {
  isLoggedIn: boolean;
  hasOnlyPostsRead: boolean;
  canAccessDashboard: boolean;
}

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

async function getUserAccess(): Promise<UserAccess> {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  if (!isLoggedIn || !session.user?.id) {
    return {
      isLoggedIn: false,
      hasOnlyPostsRead: false,
      canAccessDashboard: false,
    };
  }

  const permissions = await getUserPermissions(session.user.id);

  const hasOnlyPostsRead =
    permissions.length === 1 && permissions[0].key === "posts.read";

  const isAdmin = session.user.roles?.includes("admin");

  const hasDashboardPermission = permissions.some((p) =>
    DASHBOARD_PERMISSION_KEYS.includes(
      p.key as (typeof DASHBOARD_PERMISSION_KEYS)[number]
    )
  );

  const canAccessDashboard = isAdmin || hasDashboardPermission;

  return {
    isLoggedIn: true,
    hasOnlyPostsRead,
    canAccessDashboard,
  };
}

function HeroSection({ userAccess }: { userAccess: UserAccess }) {
  const { isLoggedIn, hasOnlyPostsRead, canAccessDashboard } = userAccess;

  return (
    <section className="text-center mb-16 space-y-6">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
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
        A clean, modern, and role-based CMS built with Next.js and TypeScript.
        Manage your content seamlessly with RBAC architecture.
      </p>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        {!isLoggedIn ? (
          <GuestActions />
        ) : hasOnlyPostsRead ? (
          <PostsOnlyAction />
        ) : canAccessDashboard ? (
          <DashboardAction />
        ) : (
          <NoAccessMessage />
        )}
      </div>
    </section>
  );
}

function GuestActions() {
  return (
    <>
      <Link href="/auth/signup">
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
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
  );
}

function PostsOnlyAction() {
  return (
    <Link href="/posts">
      <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
        <FileText className="h-4 w-4" />
        View All Posts
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

function DashboardAction() {
  return (
    <Link href="/dashboard">
      <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

function NoAccessMessage() {
  return (
    <p className="text-muted-foreground">
      Contact an administrator for access.
    </p>
  );
}

function PostsSection({
  latestPosts,
  totalPosts,
  isLoggedIn,
}: {
  latestPosts: Post[];
  totalPosts: number;
  isLoggedIn: boolean;
}) {
  return (
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
        {totalPosts > 6 && (
          <Link href="/posts">
            <Button variant="ghost" className="gap-2 group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
      </div>

      {latestPosts.length === 0 ? (
        <EmptyPostsState isLoggedIn={isLoggedIn} />
      ) : (
        <PostsGrid posts={latestPosts} totalPosts={totalPosts} />
      )}
    </section>
  );
}

function EmptyPostsState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
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
            <Button className="gap-2 shadow-lg shadow-primary/25">
              <Sparkles className="h-4 w-4" />
              Get Started
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function PostsGrid({
  posts,
  totalPosts,
}: {
  posts: Post[];
  totalPosts: number;
}) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {totalPosts > 6 && (
        <div className="text-center pt-8">
          <Link href="/posts">
            <Button size="lg" variant="outline" className="gap-2 group">
              View All Posts
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

export default async function HomePage() {
  const [allPosts, userAccess] = await Promise.all([
    getPublishedPosts(),
    getUserAccess(),
  ]);

  const latestPosts = allPosts.slice(0, 6);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        <HeroSection userAccess={userAccess} />
        <PostsSection
          latestPosts={latestPosts}
          totalPosts={allPosts.length}
          isLoggedIn={userAccess.isLoggedIn}
        />
      </main>

      <Footer />
    </>
  );
}
