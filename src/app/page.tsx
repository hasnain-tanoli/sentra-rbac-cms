import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PostCard } from "@/components/posts/PostCard";
import { Post } from "@/types/post";

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

    // Filter to only return published posts
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

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 md:px-8 py-16 flex flex-col items-center">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="text-primary">Sentra</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            A clean, modern, and role-based CMS built with Next.js and
            TypeScript. Manage your content seamlessly with RBAC architecture.
          </p>
        </section>

        <section className="w-full">
          <h2 className="text-2xl font-semibold mb-8 text-center md:text-left">
            Latest Posts
          </h2>

          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center">
              No posts available yet.{" "}
              <a
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </a>{" "}
              to create one.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
