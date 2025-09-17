import AppHeader from "@/components/layout/AppHeader";
import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meblomat",
  description: "Authentication demo powered by Supabase and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="border-t border-black/10 bg-white/80 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-neutral-900/80 dark:text-white/60">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
              <span>&copy; {year} Meblomat. All rights reserved.</span>
              <Link className="font-medium text-black transition hover:text-black/80 dark:text-white dark:hover:text-white/80" href="/auth/register">
                Get started
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
