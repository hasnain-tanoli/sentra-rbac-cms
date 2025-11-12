import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import parse from "html-react-parser";
import { connectDB } from "@/lib/db/connection";
import { Post as PostModel } from "@/lib/db/models/post.model";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

interface PostAuthor {
  name: string;
  email: string;
}

interface Post {
  title: string;
  content: string;
  status: "published" | "draft";
  createdAt?: string;
  created_at?: string;
  author_id?: PostAuthor;
}

async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    await connectDB();

    const post = await PostModel.findOne({ slug, status: "published" })
      .populate("author_id", "name email")
      .lean();

    if (!post) return null;

    return JSON.parse(JSON.stringify(post)) as Post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

function calculateReadingTime(content: string): number {
  const plainText = content.replace(/<[^>]*>?/gm, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 200);
}

function extractPlainText(html: string, maxLength = 160): string {
  const plainText = html.replace(/<[^>]*>?/gm, "");
  return plainText.substring(0, maxLength).trim();
}

function formatDate(date: string | undefined): string {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Sentra",
      description: "The requested post could not be found",
    };
  }

  return {
    title: `${post.title} | Sentra`,
    description: extractPlainText(post.content) || "Read this post on Sentra",
  };
}

function BackButton() {
  return (
    <Link href="/" className="inline-block mb-8">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 hover:gap-3 transition-all group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to all posts
      </Button>
    </Link>
  );
}

function PostStatus({ status }: { status: "published" | "draft" }) {
  return (
    <Badge
      variant={status === "published" ? "default" : "secondary"}
      className="text-xs font-medium px-3 py-1"
    >
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );
}

function PostMetadata({
  author,
  date,
  readingTime,
}: {
  author?: PostAuthor;
  date: string;
  readingTime: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
      {author && (
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground">{author.name}</span>
        </div>
      )}

      {date && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{readingTime} min read</span>
      </div>
    </div>
  );
}

function PostHeader({
  title,
  status,
  author,
  date,
  readingTime,
}: {
  title: string;
  status: "published" | "draft";
  author?: PostAuthor;
  date: string;
  readingTime: number;
}) {
  return (
    <div className="space-y-6">
      <PostStatus status={status} />

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
        {title}
      </h1>

      <PostMetadata author={author} date={date} readingTime={readingTime} />

      <Separator />
    </div>
  );
}

function PostContent({ content }: { content: string }) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6 sm:p-8 lg:p-12">
        <div
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-4xl prose-h1:mb-4 prose-h1:mt-8
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
            prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
            prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-foreground/90 prose-p:mb-6
            prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:transition-colors hover:prose-a:text-primary/80 hover:prose-a:underline hover:prose-a:underline-offset-4
            prose-strong:text-foreground prose-strong:font-semibold
            prose-em:text-foreground/90
            prose-code:text-primary prose-code:bg-muted/50 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg prose-pre:shadow-sm
            prose-blockquote:border-l-4 prose-blockquote:border-l-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/80
            prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-foreground/90 prose-li:my-2 prose-li:leading-relaxed
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8 prose-img:border prose-img:border-border/50
            prose-hr:border-border/50 prose-hr:my-12"
        >
          {parse(content)}
        </div>
      </CardContent>
    </Card>
  );
}

function AuthorCard({ author }: { author: PostAuthor }) {
  return (
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
              {author.name}
            </p>
            <p className="text-sm text-muted-foreground">{author.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostFooter({ readingTime }: { readingTime: number }) {
  return (
    <div className="pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <Link href="/">
        <Button variant="outline" className="gap-2 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to all posts
        </Button>
      </Link>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{readingTime} minute read</span>
      </div>
    </div>
  );
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const displayDate = post.createdAt || post.created_at || "";
  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 bg-linear-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <BackButton />

          <article className="space-y-8">
            <PostHeader
              title={post.title}
              status={post.status}
              author={post.author_id}
              date={displayDate}
              readingTime={readingTime}
            />

            <PostContent content={post.content} />

            {post.author_id && <AuthorCard author={post.author_id} />}

            <PostFooter readingTime={readingTime} />
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
