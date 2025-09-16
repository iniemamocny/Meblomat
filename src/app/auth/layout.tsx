import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl flex-col justify-center px-4 py-16">
      <div className="w-full space-y-8 rounded-2xl border border-black/10 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-neutral-900">
        {children}
      </div>
    </section>
  );
}
