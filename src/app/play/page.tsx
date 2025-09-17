export default function PlayPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-4 py-16">
      <section className="space-y-6 text-center md:text-left">
        <span className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/70 dark:border-white/20 dark:text-white/70">
          Try it yourself
        </span>
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Welcome to the play area</h1>
          <p className="text-lg text-black/60 dark:text-white/60 sm:text-xl">
            Explore interactive demos and prototype ideas in a dedicated space designed for experimentation.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-black dark:text-white">Instant feedback</h2>
          <p className="mt-3 text-sm/6 text-black/60 dark:text-white/60">
            Test new flows quickly and iterate with confidence using the same building blocks as the production app.
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-black dark:text-white">Shared components</h2>
          <p className="mt-3 text-sm/6 text-black/60 dark:text-white/60">
            Reuse established layout and style tokens so every experiment feels consistent and on-brand.
          </p>
        </article>
      </section>
    </div>
  );
}
