"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { translations } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { login: loginTexts } = translations[language].auth;
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (user) {
        router.replace("/dashboard");
      }
    };

    checkSession().catch(() => {
      // Ignore errors and allow the user to attempt login.
    });

    return () => {
      active = false;
    };
  }, [router, supabase]);

  if (!isSupabaseConfigured) {
    return (
      <SupabaseEnvWarning description="Add your Supabase project credentials to enable the login experience." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">{loginTexts.title}</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">{loginTexts.description}</p>
      </div>
      <AuthForm view="sign_in" showLinks={false} className="space-y-4" />
      <p className="text-sm/6 text-black/60 dark:text-white/60">
        {loginTexts.noAccountPrompt}{" "}
        <Link className="font-semibold text-black dark:text-white" href="/auth/register">
          {loginTexts.registerLinkLabel}
        </Link>
        .
      </p>
    </div>
  );
}
