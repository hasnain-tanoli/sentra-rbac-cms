import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/types/post";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Calendar, User } from "lucide-react";

interface PostCardProps {
  post: Post;
}

function stripHtml(html: string): string {
  let text = html.replace(/<[^>]*>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.trim().replace(/\s+/g, " ");
}

export function PostCard({ post }: PostCardProps) {
  const { title, content, author_id, created_at, status, slug } = post;
  const contentPreview = stripHtml(content);

  const authorName = typeof author_id === "object" ? author_id.name : "Unknown";

  return (
    <Link href={`/posts/${slug}`} className="block h-full group">
      <Card className="h-full border bg-background/60 backdrop-blur-sm transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {status === "published" ? (
              <Badge variant="default" className="shrink-0">
                Published
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Draft
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {contentPreview}
          </p>
        </CardContent>

        <CardFooter className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{authorName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
