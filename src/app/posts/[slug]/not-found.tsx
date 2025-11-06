import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-linear-to-b from-background to-muted/20 px-4">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardContent className="py-16 px-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-destructive/10 p-6">
                <FileQuestion className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Content */}
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Sorry, the post you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="gap-2">
                  <Home className="h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/dashboard/posts">
                <Button variant="outline" size="lg" className="gap-2">
                  <ArrowLeft className="h-5 w-5" />
                  View All Posts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}