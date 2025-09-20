"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthView =
  | "sign_in"
  | "sign_up"
  | "magic_link"
  | "forgotten_password"
  | "update_password"
  | "verify_otp";

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

type OnSignedInCallback = (args: {
  session: Session;
  supabase: SupabaseBrowserClient;
}) => Promise<boolean | void> | boolean | void;

type Props = {
  view: AuthView;
  redirectPath?: string;
  emailRedirectPath?: string;
  showLinks?: boolean;
  className?: string;
  disableEmailRedirect?: boolean;
  onSignedIn?: OnSignedInCallback;
};

export function AuthForm({
  view,
  redirectPath = "/dashboard",
  emailRedirectPath = "/auth/verify",
  showLinks = true,
  className,
  disableEmailRedirect = false,
  onSignedIn,
}: Props) {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [emailRedirectUrl, setEmailRedirectUrl] = useState<string | undefined>();

  useEffect(() => {
    if (disableEmailRedirect) {
      setEmailRedirectUrl(undefined);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    try {
      const url = new URL(emailRedirectPath, window.location.origin);
      setEmailRedirectUrl(url.toString());
    } catch {
      setEmailRedirectUrl(undefined);
    }
  }, [disableEmailRedirect, emailRedirectPath]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          let allowRedirect = true;

          if (event === "SIGNED_IN" && session && onSignedIn) {
            try {
              const result = await onSignedIn({
                session,
                supabase,
              });

              if (result === false) {
                allowRedirect = false;
              }
            } catch (error) {
              console.error("Failed to handle signed-in callback", error);
            }
          }

          if (allowRedirect) {
            if (redirectPath) {
              router.replace(redirectPath);
            }
            router.refresh();
          }

          return;
        }

        if (event === "SIGNED_OUT") {
          router.refresh();
        }
      },
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [onSignedIn, redirectPath, router, supabase]);

  if (!supabase) {
    return null;
  }

  return (
    <div className={className}>
      <Auth
        supabaseClient={supabase}
        view={view}
        showLinks={showLinks}
        providers={[]}
        redirectTo={emailRedirectUrl}
        magicLink
        appearance={{
          theme: ThemeSupa,
          className: {
            button: "rounded-md",
            container: "space-y-4",
            input: "rounded-md",
          },
        }}
      />
    </div>
  );
}
