import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        {/* Logo + Name */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Logo-with-Text.svg"
            alt="Sentra Logo"
            width={120}
            height={30}
            className="h-8 w-auto"
          />
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/about"
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground text-center md:text-right">
          © {new Date().getFullYear()} Sentra. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
