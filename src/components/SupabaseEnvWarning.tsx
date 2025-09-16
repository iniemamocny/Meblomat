type Props = {
  title?: string;
  description?: string;
  className?: string;
};

export function SupabaseEnvWarning({
  title = "Supabase configuration required",
  description = "This environment is missing the Supabase credentials needed to run authentication and profile features.",
  className,
}: Props) {
  const classes = ["space-y-4 text-center sm:text-left", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm/6 text-black/60 dark:text-white/60">{description}</p>
      <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-left text-sm/6 text-amber-900 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-100">
        <p>
          Set <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and
          {" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your
          <br className="hidden sm:block" />
          environment to enable Supabase authentication.
        </p>
      </div>
    </div>
  );
}
