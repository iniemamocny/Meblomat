"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AvatarPicker } from "@/components/dashboard/AvatarPicker";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  DEFAULT_AVATAR_ID,
  getAvatarPresetIcon,
  type AvatarType,
} from "@/lib/avatar";
import {
  listActiveCarpenters,
  listCarpenterClients,
  type ActiveCarpenter,
  type AssignedCarpenter,
  type CarpenterClient,
  getAssignedCarpenter,
} from "@/lib/carpenters";
import { generateInvitation } from "@/lib/invitations";
import {
  fetchProjectsForCarpenter,
  fetchProjectsForClient,
  submitProjectBrief,
  type ProjectRecord,
} from "@/lib/projects";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AccountType = "carpenter" | "client" | "admin";

type ProfileRow = {
  subscription_expires_at: string | null;
  avatar_type: AvatarType | null;
  avatar_path: string | null;
  account_type: AccountType | null;
};

type AvatarChangePayload = {
  type: AvatarType;
  path: string;
  imageUrl: string | null;
  error?: string | null;
};

type InvitationRow = {
  token: string;
  invitedEmail: string;
  expiresAt: string;
  acceptedAt: string | null;
};

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const TRIAL_PERIOD_IN_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_ACCOUNT_TYPE: AccountType = "client";

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] =
    useState<string | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [avatarType, setAvatarType] = useState<AvatarType>("icon");
  const [avatarPath, setAvatarPath] = useState<string>(DEFAULT_AVATAR_ID);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [carpenterClients, setCarpenterClients] = useState<CarpenterClient[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [assignedCarpenter, setAssignedCarpenter] =
    useState<AssignedCarpenter | null>(null);
  const [availableCarpenters, setAvailableCarpenters] = useState<
    ActiveCarpenter[]
  >([]);
  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [isInvitationSubmitting, setIsInvitationSubmitting] = useState(false);
  const [inviteBaseUrl, setInviteBaseUrl] = useState<string | null>(null);
  const [projectCarpenterId, setProjectCarpenterId] = useState<string | null>(
    null,
  );
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [projectSubmitError, setProjectSubmitError] = useState<string | null>(
    null,
  );
  const [projectSubmitSuccess, setProjectSubmitSuccess] =
    useState<string | null>(null);
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  const [areProjectsOpen, setAreProjectsOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setInviteBaseUrl(window.location.origin);
    } catch {
      setInviteBaseUrl(null);
    }
  }, []);

  const handleAvatarChange = useCallback(
    (change: AvatarChangePayload) => {
      const normalizedPath = change.path || DEFAULT_AVATAR_ID;
      const nextType: AvatarType = change.type === "upload" ? "upload" : "icon";

      setAvatarType(nextType);
      setAvatarPath(normalizedPath);

      if (nextType === "upload") {
        setAvatarUrl(change.imageUrl ?? null);
        setAvatarLoadError(
          change.error
            ? "Nie udało się wczytać podglądu avatara. Spróbuj odświeżyć stronę lub wybrać plik ponownie."
            : null,
        );
      } else {
        setAvatarUrl(null);
        setAvatarLoadError(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !user) {
        router.replace("/auth/login");
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      const {
        data: profile,
        error: profileFetchError,
      } = await supabase
        .from("profiles")
        .select(
          "subscription_expires_at, avatar_type, avatar_path, account_type",
        )
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (!active) {
        return;
      }

      let nextAvatarType: AvatarType = "icon";
      let nextAvatarPath = DEFAULT_AVATAR_ID;
      let nextAvatarUrl: string | null = null;
      let hasPreviewError = false;

      const userCreatedAt = user.created_at ? new Date(user.created_at) : null;
      const fallbackTrialExpiry =
        userCreatedAt && !Number.isNaN(userCreatedAt.getTime())
          ? new Date(userCreatedAt.getTime() + TRIAL_PERIOD_IN_MS)
          : null;
      const fallbackTrialExpiryIso =
        fallbackTrialExpiry?.toISOString() ?? null;

      let nextSubscriptionExpiresAt = fallbackTrialExpiryIso;
      let nextAccountType: AccountType | null = null;
      let nextProfileError = false;
      let profileMissing = false;

      const hasProfile = Boolean(profile);

      if (!profileFetchError && hasProfile && profile) {
        nextAvatarType = profile.avatar_type === "upload" ? "upload" : "icon";
        nextAvatarPath = profile.avatar_path ?? DEFAULT_AVATAR_ID;

        if (nextAvatarType === "upload" && profile.avatar_path) {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("avatars")
              .createSignedUrl(profile.avatar_path, 60 * 60 * 24 * 7);

          if (!active) {
            return;
          }

          if (signedUrlError) {
            hasPreviewError = true;
          } else {
            nextAvatarUrl = signedUrlData?.signedUrl ?? null;
          }
        }

        nextSubscriptionExpiresAt =
          profile.subscription_expires_at ?? fallbackTrialExpiryIso;
        nextAccountType = profile.account_type ?? DEFAULT_ACCOUNT_TYPE;
      } else {
        nextProfileError = true;

        if (!hasProfile && !profileFetchError) {
          profileMissing = true;
          nextAccountType = DEFAULT_ACCOUNT_TYPE;
        } else if (profileFetchError) {
          profileMissing = !hasProfile;
        }
      }

      if (profileFetchError) {
        nextProfileError = true;
        profileMissing = true;
      }

      setProfileError(nextProfileError);
      setIsProfileMissing(profileMissing);
      setSubscriptionExpiresAt(nextSubscriptionExpiresAt);
      setAccountType(nextAccountType);

      handleAvatarChange({
        type: nextAvatarType,
        path: nextAvatarPath,
        imageUrl: nextAvatarUrl,
        error: hasPreviewError ? "preview-error" : null,
      });

      setIsLoading(false);
    };

    loadProfile().catch(() => {
      if (!active) {
        return;
      }

      handleAvatarChange({
        type: "icon",
        path: DEFAULT_AVATAR_ID,
        imageUrl: null,
        error: null,
      });
      router.replace("/auth/login");
    });

    return () => {
      active = false;
    };
  }, [handleAvatarChange, router, supabase]);

  const refreshCarpenterData = useCallback(
    async (signal?: AbortSignal) => {
      if (!supabase || !userId) {
        return;
      }

      setDashboardError(null);

      try {
        const [invitationResponse, clientsList, projectList] = await Promise.all([
          supabase
            .from("carpenter_invitations")
            .select("token, invited_email, expires_at, accepted_at")
            .eq("carpenter_id", userId)
            .order("created_at", { ascending: false }),
          listCarpenterClients(supabase),
          fetchProjectsForCarpenter(supabase, userId),
        ]);

        if (signal?.aborted) {
          return;
        }

        if (invitationResponse.error) {
          throw invitationResponse.error;
        }

        const normalizedInvitations: InvitationRow[] =
          (invitationResponse.data ?? []).map((entry) => ({
            token: entry.token as string,
            invitedEmail: entry.invited_email as string,
            expiresAt: entry.expires_at as string,
            acceptedAt: (entry.accepted_at as string | null) ?? null,
          }));

        setInvitations(normalizedInvitations);
        setCarpenterClients(clientsList);
        setProjects(projectList);
        setAssignedCarpenter(null);
        setAvailableCarpenters([]);
        setProjectCarpenterId(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "We couldn't load your collaboration data.",
        );
      }
    },
    [supabase, userId],
  );

  const refreshClientData = useCallback(
    async (signal?: AbortSignal) => {
      if (!supabase || !userId) {
        return;
      }

      setDashboardError(null);

      try {
        const [assignment, projectList] = await Promise.all([
          getAssignedCarpenter(supabase),
          fetchProjectsForClient(supabase, userId),
        ]);

        if (signal?.aborted) {
          return;
        }

        setAssignedCarpenter(assignment);
        setProjects(projectList);
        setInvitations([]);
        setCarpenterClients([]);

        if (assignment) {
          setAvailableCarpenters([]);
          setProjectCarpenterId(assignment.carpenterId);
        } else {
          const activeCarpentersList = await listActiveCarpenters(supabase);

          if (signal?.aborted) {
            return;
          }

          setAvailableCarpenters(activeCarpentersList);
          setProjectCarpenterId((current) => {
            if (
              current &&
              activeCarpentersList.some(
                (carpenter: ActiveCarpenter) =>
                  carpenter.carpenterId === current,
              )
            ) {
              return current;
            }

            return null;
          });
        }
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "We couldn't load your collaboration data.",
        );
      }
    },
    [supabase, userId],
  );

  useEffect(() => {
    if (!supabase || !userId || !accountType) {
      return;
    }

    const abortController = new AbortController();

    if (accountType === "carpenter") {
      refreshCarpenterData(abortController.signal);
    } else if (accountType === "client") {
      refreshClientData(abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [accountType, refreshCarpenterData, refreshClientData, supabase, userId]);

  const handleInvitationSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!supabase || !userId) {
        return;
      }

      const normalizedEmail = invitationEmail.trim();

      if (!normalizedEmail) {
        setInvitationError("Enter an email address to invite a client.");
        return;
      }

      setInvitationError(null);
      setDashboardError(null);
      setInvitationLink(null);
      setIsInvitationSubmitting(true);

      try {
        const expiresAt = new Date(Date.now() + ONE_WEEK_IN_MS);
        const invitation = await generateInvitation(
          supabase,
          userId,
          normalizedEmail,
          expiresAt,
        );

        const baseUrl = inviteBaseUrl ??
          (typeof window !== "undefined" ? window.location.origin : "");
        const shareUrl = baseUrl
          ? `${baseUrl}/invite/${invitation.token}`
          : `/invite/${invitation.token}`;

        setInvitationLink(shareUrl);
        setInvitationEmail("");
        await refreshCarpenterData();
      } catch (error) {
        setDashboardError(
          error instanceof Error
            ? error.message
            : "We couldn't create a new invitation.",
        );
      } finally {
        setIsInvitationSubmitting(false);
      }
    },
    [
      supabase,
      userId,
      invitationEmail,
      inviteBaseUrl,
      refreshCarpenterData,
    ],
  );

  const handleProjectSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!supabase) {
        return;
      }

      if (!projectCarpenterId) {
        setProjectSubmitError(
          "Wybierz stolarza przed wysłaniem briefu projektu.",
        );
        return;
      }

      const normalizedTitle = projectTitle.trim();
      const normalizedDetails = projectDetails.trim();

      if (!normalizedTitle) {
        setProjectSubmitError("Podaj krótki tytuł projektu.");
        return;
      }

      if (!normalizedDetails) {
        setProjectSubmitError(
          "Opisz swój projekt, aby stolarz mógł odpowiedzieć.",
        );
        return;
      }

      setProjectSubmitError(null);
      setProjectSubmitSuccess(null);
      setIsProjectSubmitting(true);

      try {
        await submitProjectBrief(
          supabase,
          projectCarpenterId,
          normalizedTitle,
          normalizedDetails,
        );

        setProjectTitle("");
        setProjectDetails("");
        setProjectSubmitSuccess(
          "Brief projektu został wysłany do stolarza.",
        );
        await refreshClientData();
      } catch (error) {
        setProjectSubmitError(
          error instanceof Error
            ? error.message
            : "Nie udało się wysłać projektu. Spróbuj ponownie.",
        );
      } finally {
        setIsProjectSubmitting(false);
      }
    },
    [
      supabase,
      projectCarpenterId,
      projectTitle,
      projectDetails,
      refreshClientData,
    ],
  );

  const expirationDate = parseDate(subscriptionExpiresAt);
  const now = new Date();
  const isAdminView = accountType === "admin";
  const isCarpenterView = accountType === "carpenter";
  const isClientView = accountType === "client";
  const pendingInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      if (invitation.acceptedAt) {
        return false;
      }

      const expires = parseDate(invitation.expiresAt);
      return !expires || expires.getTime() > Date.now();
    });
  }, [invitations]);
  const projectsByClient = useMemo(() => {
    const grouped = new Map<string, ProjectRecord[]>();

    for (const project of projects) {
      const entries = grouped.get(project.clientId);

      if (entries) {
        entries.push(project);
      } else {
        grouped.set(project.clientId, [project]);
      }
    }

    return grouped;
  }, [projects]);
  const clientsById = useMemo(() => {
    const map = new Map<string, string | null>();

    for (const client of carpenterClients) {
      map.set(client.clientId, client.clientEmail ?? null);
    }

    return map;
  }, [carpenterClients]);
  const knownCarpenters = useMemo(() => {
    const map = new Map<string, string | null>();

    if (assignedCarpenter) {
      map.set(
        assignedCarpenter.carpenterId,
        assignedCarpenter.carpenterEmail ?? null,
      );
    }

    for (const carpenter of availableCarpenters) {
      map.set(carpenter.carpenterId, carpenter.carpenterEmail ?? null);
    }

    return map;
  }, [assignedCarpenter, availableCarpenters]);
  const canSubmitProject = Boolean(projectCarpenterId);
  const rawProjectsId = useId();
  const projectsContentId = `client-projects-${rawProjectsId.replace(/:/g, "")}`;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-16">
        <SupabaseEnvWarning description="Add your Supabase credentials to load account and subscription details." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-base text-black/60 dark:text-white/60">
            Loading your account details…
          </p>
        </header>
      </div>
    );
  }

  let warning: { title: string; description: string } | null = null;

  if (profileError) {
    if (isProfileMissing) {
      warning = {
        title: "Finish configuring Supabase",
        description:
          "We couldn't find your profile data. Apply the SQL from docs/supabase-setup.md so the profiles table and defaults exist.",
      };
    } else {
      warning = {
        title: "Subscription details unavailable",
        description:
          "We couldn't load your subscription information. Please try again later.",
      };
    }
  } else if (!expirationDate) {
    warning = {
      title: "No active subscription",
      description:
        "We couldn't find an active subscription for your account. Update your billing details to avoid interruptions.",
    };
  } else {
    const timeRemaining = expirationDate.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      warning = {
        title: "Your subscription has expired",
        description: `Access ended on ${formatDateTime(expirationDate)}. Renew to regain full access to the platform.`,
      };
    } else if (timeRemaining <= ONE_WEEK_IN_MS) {
      warning = {
        title: "Subscription expiring soon",
        description: `Your subscription will expire on ${formatDateTime(expirationDate)}. Consider renewing to keep your tools running without interruptions.`,
      };
    }
  }

  const avatarPresetIcon = getAvatarPresetIcon(avatarPath);
  const avatarInitials = userEmail?.[0]?.toUpperCase();
  const showPreviewLoadingMessage =
    avatarType === "upload" && !avatarUrl && !avatarLoadError;
  const avatarFallbackIcon = (
    <span aria-hidden="true" className="text-2xl">
      {avatarPresetIcon}
    </span>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
      <details
        open
        className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
          <span>Ustawienia ogólne</span>
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </summary>
        <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
          <div className="space-y-8">
            <header className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-base text-black/60 dark:text-white/60">
                Welcome back{userEmail ? `, ${userEmail}` : ""}.
              </p>
            </header>

            <section className="grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <h2 className="text-lg font-semibold">Account overview</h2>
                <dl className="mt-4 space-y-4 text-sm/6 text-black/70 dark:text-white/70">
                  <div>
                    <dt className="font-medium text-black dark:text-white">Email</dt>
                    <dd className="mt-1 break-all">{userEmail ?? "Unknown"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black dark:text-white">Subscription expires</dt>
                    <dd className="mt-1">{formatDateTime(expirationDate)}</dd>
                  </div>
                </dl>
              </article>

              <article className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <h2 className="text-lg font-semibold">Quick actions</h2>
                <p className="text-sm/6 text-black/60 dark:text-white/60">
                  Manage your access and keep your account secure.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
                    href="/auth/logout"
                  >
                    Sign out
                  </Link>
                  <a
                    className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
                    href="mailto:support@example.com"
                  >
                    Contact support
                  </a>
                </div>
              </article>

              <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 md:col-span-2">
                <h2 className="text-lg font-semibold">Avatar</h2>
                <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                  Wybierz ikonę, która będzie widoczna w nagłówku i na dashboardzie.
                </p>
                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                  <UserAvatar
                    imageUrl={avatarType === "upload" ? avatarUrl : null}
                    fallbackIcon={avatarFallbackIcon}
                    initials={avatarInitials}
                    className="size-16 text-2xl"
                  />
                  <div className="text-sm/6 text-black/60 dark:text-white/60">
                    {avatarLoadError ? (
                      <p className="text-red-600 dark:text-red-400">{avatarLoadError}</p>
                    ) : showPreviewLoadingMessage ? (
                      <p>Trwa generowanie podglądu przesłanego obrazu…</p>
                    ) : (
                      <p>Tak będzie wyglądał Twój profil w aplikacji.</p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  {supabase && userId ? (
                    <AvatarPicker
                      supabase={supabase}
                      userId={userId}
                      currentAvatarType={avatarType}
                      currentAvatarPath={avatarPath}
                      onAvatarChange={handleAvatarChange}
                    />
                  ) : (
                    <p className="text-sm/6 text-black/60 dark:text-white/60">
                      Zaloguj się, aby zmienić avatar.
                    </p>
                  )}
                </div>
              </article>
            </section>
          </div>
        </div>
      </details>

      {warning ? (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-100">
          <h2 className="text-lg font-semibold">{warning.title}</h2>
          <p className="mt-2 text-sm/6">{warning.description}</p>
        </div>
      ) : null}
      
      {dashboardError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-800 dark:border-red-400/60 dark:bg-red-400/10 dark:text-red-100">
          <h2 className="text-lg font-semibold">Collaboration data unavailable</h2>
          <p className="mt-2 text-sm/6">{dashboardError}</p>
        </div>
      ) : null}

      {isAdminView ? (
        <section className="space-y-6">
          <details
            className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900"
            open
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Zarządzanie użytkownikami</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Przegląd kont</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Monitoruj liczbę aktywnych ról w systemie i reaguj na oczekujące wnioski o dostęp.
                  </p>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Aktywni stolarze</dt>
                      <dd className="mt-1 text-2xl font-semibold">12</dd>
                    </div>
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Aktywni klienci</dt>
                      <dd className="mt-1 text-2xl font-semibold">87</dd>
                    </div>
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Wnioski do przeglądu</dt>
                      <dd className="mt-1 text-2xl font-semibold">5</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm/6 text-black/70 dark:text-white/70">
                    Skorzystaj z panelu administracyjnego, aby zatwierdzać nowych użytkowników lub blokować podejrzane konta.
                  </p>
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Zarządzanie subskrypcjami</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Status planów</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Przeglądaj wygasające subskrypcje i szybko kontaktuj się z zespołami sprzedaży w razie problemów z płatnościami.
                  </p>
                  <ul className="mt-4 space-y-3 text-sm/6 text-black/70 dark:text-white/70">
                    <li className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
                      <span>Subskrypcje wygasające w tym tygodniu</span>
                      <strong>8</strong>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
                      <span>Nieudane płatności do wyjaśnienia</span>
                      <strong>3</strong>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/10">
                      <span>Aktywne plany premium</span>
                      <strong>41</strong>
                    </li>
                  </ul>
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Zarządzanie stroną</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Panel treści</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Aktualizuj treści strony głównej i komunikaty w aplikacji, aby informować klientów o nowych funkcjach.
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm/6 text-black/70 dark:text-white/70">
                    <li>Zmień sekcję hero, aby promować sezonowe kampanie.</li>
                    <li>Zarządzaj biblioteką zdjęć w galerii realizacji.</li>
                    <li>Publikuj aktualności i poradniki dla użytkowników.</li>
                  </ul>
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Statystyki</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Wskaźniki platformy</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Analizuj kluczowe liczby, aby optymalizować rozwój produktu.
                  </p>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Średni czas odpowiedzi</dt>
                      <dd className="mt-1 text-xl font-semibold">2,4 h</dd>
                    </div>
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Nowe projekty / tydzień</dt>
                      <dd className="mt-1 text-xl font-semibold">56</dd>
                    </div>
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Satysfakcja klientów</dt>
                      <dd className="mt-1 text-xl font-semibold">94%</dd>
                    </div>
                    <div className="rounded-xl bg-black/5 px-4 py-3 text-sm text-black dark:bg-white/10 dark:text-white">
                      <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Ukończone projekty</dt>
                      <dd className="mt-1 text-xl font-semibold">312</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      {isCarpenterView ? (
        <section className="space-y-6">
          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900" open>
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Moje projekty</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Invite a client</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Generate a secure link that connects new clients to your workspace.
                  </p>
                  <form className="mt-4 space-y-4" onSubmit={handleInvitationSubmit} noValidate>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-black dark:text-white"
                        htmlFor="invitation-email"
                      >
                        Client email
                      </label>
                      <input
                        id="invitation-email"
                        type="email"
                        autoComplete="email"
                        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
                        value={invitationEmail}
                        onChange={(event) => setInvitationEmail(event.target.value)}
                        required
                      />
                    </div>

                    {invitationError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">{invitationError}</p>
                    ) : null}

                    {invitationLink ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-400/60 dark:bg-emerald-400/10 dark:text-emerald-100">
                        <p className="text-sm font-medium">Share this link with your client:</p>
                        <p className="mt-1 break-all font-mono text-sm">{invitationLink}</p>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white/30 dark:disabled:bg-white/40"
                      disabled={isInvitationSubmitting}
                    >
                      {isInvitationSubmitting ? "Generating link…" : "Generate invitation"}
                    </button>
                  </form>
                </article>

                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Pending invitations</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Track outstanding invitations that are waiting to be accepted.
                  </p>
                  {pendingInvitations.length > 0 ? (
                    <ul className="mt-4 space-y-4">
                      {pendingInvitations.map((invitation) => {
                        const expires = parseDate(invitation.expiresAt);
                        const shareUrl = inviteBaseUrl
                          ? `${inviteBaseUrl}/invite/${invitation.token}`
                          : `/invite/${invitation.token}`;

                        return (
                          <li
                            key={invitation.token}
                            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-black dark:text-white">
                                  {invitation.invitedEmail}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
                                  Expires {formatDateTime(expires)}
                                </p>
                              </div>
                              <Link
                                className="text-sm font-medium text-black underline-offset-4 hover:underline dark:text-white"
                                href={`/invite/${invitation.token}`}
                              >
                                Open invite
                              </Link>
                            </div>
                            <p className="mt-2 break-all text-xs font-mono text-black/60 dark:text-white/60">
                              {shareUrl}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                      You don&apos;t have any pending invitations. Generate a new link to start collaborating with a client.
                    </p>
                  )}
                </article>

                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Project briefs</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Monitor the latest ideas your clients have shared and keep track of their status.
                  </p>
                  {projects.length > 0 ? (
                    <ul className="mt-4 space-y-4">
                      {projects.map((project) => {
                        const submitted = parseDate(project.submittedAt);
                        const clientLabel = clientsById.get(project.clientId) ?? project.clientId;

                        return (
                          <li
                            key={project.id}
                            className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-black dark:text-white">
                                  {project.title}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
                                  Klient: {clientLabel}
                                </p>
                                {project.details ? (
                                  <p className="mt-1 text-sm/6 text-black/70 dark:text-white/70">
                                    {project.details}
                                  </p>
                                ) : null}
                              </div>
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                                {project.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                              Submitted {formatDateTime(submitted)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                      You haven&apos;t received any briefs yet. Clients will appear here after they send their first project.
                    </p>
                  )}
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Klienci</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Assigned clients</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Review the clients connected to your workspace and see the latest briefs they have submitted.
                  </p>
                  {carpenterClients.length > 0 ? (
                    <ul className="mt-4 space-y-5">
                      {carpenterClients.map((client) => {
                        const clientProjects = projectsByClient.get(client.clientId) ?? [];

                        return (
                          <li
                            key={client.clientId}
                            className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-black dark:text-white">
                                  {client.clientEmail ?? "Client"}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
                                  ID: {client.clientId}
                                </p>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/80 dark:bg-white/10 dark:text-white/80">
                                {clientProjects.length} {clientProjects.length === 1 ? "project" : "projects"}
                              </span>
                            </div>

                            {clientProjects.length > 0 ? (
                              <ul className="mt-3 space-y-3">
                                {clientProjects.map((project) => {
                                  const submitted = parseDate(project.submittedAt);

                                  return (
                                    <li
                                      key={project.id}
                                      className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-neutral-900/60"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                          <p className="text-sm font-semibold text-black dark:text-white">
                                            {project.title}
                                          </p>
                                          {project.details ? (
                                            <p className="mt-1 text-sm/6 text-black/70 dark:text-white/70">
                                              {project.details}
                                            </p>
                                          ) : null}
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                                          {project.status.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                                        Submitted {formatDateTime(submitted)}
                                      </p>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm/6 text-black/60 dark:text-white/60">
                                This client hasn&apos;t submitted any project briefs yet.
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                      When clients accept your invitations they will appear here.
                    </p>
                  )}
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Ustawienia ogólne projektów</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Konfiguracja projektów</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Personalizowane ustawienia briefów pojawią się wkrótce. Tutaj określisz domyślne terminy, zakresy oraz checklisty dla nowych projektów.
                  </p>
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Kalendarz</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Planowanie pracy</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Widok kalendarza będzie dostępny, gdy tylko zsynchronizujemy harmonogramy z briefami projektów.
                  </p>
                </article>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Rozliczenia</span>
              <svg
                aria-hidden="true"
                className="size-4 shrink-0 text-black/60 transition group-open:rotate-180 dark:text-white/60"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <div className="border-t border-black/10 px-6 py-6 dark:border-white/10">
              <div className="space-y-6">
                <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                  <h2 className="text-lg font-semibold">Status rozliczeń</h2>
                  <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                    Sekcja rozliczeń pojawi się tutaj, aby śledzić płatności i faktury powiązane z projektami.
                  </p>
                </article>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      {isClientView ? (
        <section className="space-y-6">
          <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">Your carpenter</h2>
            {assignedCarpenter ? (
              <div className="mt-3 space-y-2 text-sm/6 text-black/70 dark:text-white/70">
                <p className="text-base font-semibold text-black dark:text-white">
                  {assignedCarpenter.carpenterEmail ?? "Assigned carpenter"}
                </p>
                <p>
                  You&apos;re connected to this carpenter for all future project briefs.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm/6 text-black/60 dark:text-white/60">
                You&apos;re not linked to a carpenter yet. Choose one below when you submit your first project brief.
              </p>
            )}
          </article>

          {!assignedCarpenter ? (
            <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold">Available carpenters</h2>
              <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                Only carpenters with an active subscription appear in this list.
              </p>
              {availableCarpenters.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {availableCarpenters.map((carpenter) => (
                    <li
                      key={carpenter.carpenterId}
                      className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-black dark:text-white">
                        {carpenter.carpenterEmail ?? "Carpenter"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
                        Subscription valid until {formatDateTime(parseDate(carpenter.subscriptionExpiresAt))}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                  No carpenters are accepting new collaborations right now. Check back later or contact support if you need urgent assistance.
                </p>
              )}
            </article>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-6 py-4 text-lg font-semibold text-black transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/20"
              aria-expanded={areProjectsOpen}
              aria-controls={projectsContentId}
              onClick={() => setAreProjectsOpen((open) => !open)}
            >
              <span>Moje projekty</span>
              <svg
                aria-hidden="true"
                className={`size-4 shrink-0 text-black/60 transition ${areProjectsOpen ? "rotate-180" : ""} dark:text-white/60`}
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 8l5 5 5-5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
            <div
              id={projectsContentId}
              aria-hidden={!areProjectsOpen}
              className={`space-y-6 border-t border-black/10 px-6 py-6 dark:border-white/10 ${areProjectsOpen ? "" : "hidden"}`}
            >
              <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <h2 className="text-lg font-semibold">Wyślij brief projektu</h2>
                <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
                  Podziel się szczegółami projektu, a my natychmiast powiadomimy przydzielonego stolarza.
                </p>
                <form className="mt-4 space-y-4" onSubmit={handleProjectSubmit} noValidate>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-black dark:text-white"
                      htmlFor="project-carpenter"
                    >
                      Stolarz
                    </label>
                    <select
                      id="project-carpenter"
                      className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
                      value={projectCarpenterId ?? ""}
                      onChange={(event) => setProjectCarpenterId(event.target.value || null)}
                      disabled={Boolean(assignedCarpenter)}
                    >
                      {assignedCarpenter ? (
                        <option value={assignedCarpenter.carpenterId}>
                          {assignedCarpenter.carpenterEmail ?? "Przydzielony stolarz"}
                        </option>
                      ) : (
                        <>
                          <option value="">
                            Wybierz stolarza
                          </option>
                          {availableCarpenters.map((carpenter) => (
                            <option key={carpenter.carpenterId} value={carpenter.carpenterId}>
                              {carpenter.carpenterEmail ?? carpenter.carpenterId}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-black dark:text-white"
                      htmlFor="project-title"
                    >
                      Tytuł projektu
                    </label>
                    <input
                      id="project-title"
                      type="text"
                      className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
                      value={projectTitle}
                      onChange={(event) => setProjectTitle(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-black dark:text-white"
                      htmlFor="project-details"
                    >
                      Szczegóły projektu
                    </label>
                    <textarea
                      id="project-details"
                      className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
                      rows={5}
                      value={projectDetails}
                      onChange={(event) => setProjectDetails(event.target.value)}
                      required
                    />
                  </div>

                  {projectSubmitError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{projectSubmitError}</p>
                  ) : null}

                  {projectSubmitSuccess ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">{projectSubmitSuccess}</p>
                  ) : null}

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white/30 dark:disabled:bg-white/40"
                    disabled={isProjectSubmitting || !canSubmitProject}
                  >
                    {isProjectSubmitting ? "Wysyłanie briefu…" : "Wyślij brief"}
                  </button>
                </form>
              </article>

              <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <h2 className="text-lg font-semibold">Twoje projekty</h2>
                {projects.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {projects.map((project) => {
                      const submitted = parseDate(project.submittedAt);
                      const carpenterEmail = knownCarpenters.get(project.carpenterId) ?? project.carpenterId;

                      return (
                        <li
                          key={project.id}
                          className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-black dark:text-white">
                                {project.title}
                              </p>
                              <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
                                Stolarz: {carpenterEmail ?? "Nieznany"}
                              </p>
                              {project.details ? (
                                <p className="mt-1 text-sm/6 text-black/70 dark:text-white/70">
                                  {project.details}
                                </p>
                              ) : null}
                            </div>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                              {project.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                            Wysłano {formatDateTime(submitted)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                    Nie przesłałeś jeszcze żadnych projektów. Użyj formularza powyżej, aby podzielić się pierwszym pomysłem.
                  </p>
                )}
              </article>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
