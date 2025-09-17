import InviteClientPage from "./InviteClientPage";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [] as Array<{ token: string }>;
}

type InvitePageProps = {
  params: Promise<{ token?: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  let token: string | null = null;
  let initialTokenError: "missing" | "unreadable" | undefined;

  try {
    const resolved = await params;
    const rawToken =
      typeof resolved?.token === "string" ? resolved.token : "";
    const normalized = rawToken.trim();

    if (normalized) {
      token = normalized;
    } else {
      initialTokenError = "missing";
    }
  } catch {
    initialTokenError = "unreadable";
  }

  return (
    <InviteClientPage token={token} initialTokenError={initialTokenError} />
  );
}
