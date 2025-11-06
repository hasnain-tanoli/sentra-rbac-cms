import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import parse from "html-react-parser";

type Props = {
  params: Promise<{ slug: string }>;
};

type Post = {
  title: string;
  content: string;
  status: "published" | "draft";
  createdAt?: string;
  created_at?: string;
  author_id?: {
    name: string;
    email: string;
  };
};

async function getPostData(slug: string): Promise<Post | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/posts/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.success ? data.data : null;
}

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const post = await getPostData(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const plainTextContent = post.content.replace(/<[^>]*>?/gm, "");

  return {
    title: post.title,
    description: plainTextContent.substring(0, 160),
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const post = await getPostData(params.slug);

  if (!post) {
    notFound();
  }

  const displayDate = post.createdAt || post.created_at;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const plainTextContent = post.content.replace(/<[^>]*>?/gm, "");
  const wordCount = plainTextContent.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-linear-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button */}
          <Link href="/" className="inline-block mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:gap-3 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all posts
            </Button>
          </Link>

          <article className="space-y-8">
            {/* Post Header */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    post.status === "published" ? "default" : "secondary"
                  }
                  className="text-xs font-medium px-3 py-1"
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                {post.author_id && (
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                      {post.author_id.name}
                    </span>
                  </div>
                )}

                {formattedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={displayDate}>{formattedDate}</time>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime} min read</span>
                </div>
              </div>

              <Separator />
            </div>

            {/* Post Content */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 sm:p-8 lg:p-12">
                <div
                  className="prose prose-slate dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-p:text-base prose-p:leading-7 prose-p:text-foreground/90
                  prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border
                  prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground
                  prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-foreground/90 prose-li:my-2 prose-li:leading-7
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
                  prose-hr:border-border prose-hr:my-8"
                >
                  {parse(post.content)}
                </div>
              </CardContent>
            </Card>

            {/* Author Card */}
            {post.author_id && (
              <Card className="border-2 border-primary/10 bg-primary/5">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/20 p-3 shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        About the Author
                      </h3>
                      <p className="text-lg font-semibold text-foreground">
                        {post.author_id.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {post.author_id.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer Navigation */}
            <div className="pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to all posts
                </Button>
              </Link>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{readingTime} minute read</span>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
