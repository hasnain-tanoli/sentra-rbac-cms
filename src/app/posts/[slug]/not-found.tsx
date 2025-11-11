import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-linear-to-b from-background to-muted/20 px-4 py-16">
        <div className="max-w-2xl w-full">
          <div className="rounded-lg border bg-card text-card-foreground shadow-xl">
            <div className="py-16 px-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-6">
                  <FileQuestion className="h-20 w-20 text-destructive" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  Post Not Found
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                  Sorry, the post you&apos;re looking for doesn&apos;t exist or
                  has been removed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link href="/">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/dashboard/posts">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    View All Posts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
