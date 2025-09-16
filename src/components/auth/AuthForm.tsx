"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthView =
  | "sign_in"
  | "sign_up"
  | "magic_link"
  | "forgotten_password"
  | "update_password"
  | "verify_otp";

type Props = {
  view: AuthView;
  redirectPath?: string;
  emailRedirectPath?: string;
  showLinks?: boolean;
  className?: string;
  disableEmailRedirect?: boolean;
};

export function AuthForm({
  view,
  redirectPath = "/dashboard",
  emailRedirectPath = "/auth/verify",
  showLinks = true,
  className,
  disableEmailRedirect = false,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (redirectPath) {
          router.replace(redirectPath);
        }
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [redirectPath, router, supabase]);

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
