"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Post } from "@/types/post";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { title, content, author_id, createdAt } = post;

  return (
    <Card className="border bg-background/60 backdrop-blur-sm transition hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          by {author_id?.name || "Unknown"} •{" "}
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>
      </CardContent>
    </Card>
  );
}
