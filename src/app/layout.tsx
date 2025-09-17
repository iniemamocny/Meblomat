import AppFooter from "@/components/layout/AppFooter";
import AppHeader from "@/components/layout/AppHeader";
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
  return (
    <html lang="en">
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
