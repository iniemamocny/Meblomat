"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import clsx from "classnames";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_ID,
  type AvatarType,
} from "@/lib/avatar";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 days

type AvatarChange = {
  type: AvatarType;
  path: string;
  imageUrl: string | null;
  error?: string | null;
};

type Props = {
  supabase: SupabaseClient;
  userId: string;
  currentAvatarType: AvatarType;
  currentAvatarPath?: string | null;
  onAvatarChange: (change: AvatarChange) => void;
};

type UploadProgressState = "idle" | "saving" | "uploading";

type StatusMessage = {
  tone: "neutral" | "error" | "success";
  text: string;
};

function buildUniqueFilePath(userId: string, fileName: string) {
  const cleanName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/gi, "_");
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${userId}/${uniqueId}-${cleanName}`;
}

export function AvatarPicker({
  supabase,
  userId,
  currentAvatarType,
  currentAvatarPath,
  onAvatarChange,
}: Props) {
  const [progress, setProgress] = useState<UploadProgressState>("idle");
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const normalizedPath = useMemo(
    () => currentAvatarPath ?? DEFAULT_AVATAR_ID,
    [currentAvatarPath],
  );

  const handlePresetSelection = async (presetId: string) => {
    if (progress !== "idle") {
      return;
    }

    if (currentAvatarType === "icon" && normalizedPath === presetId) {
      setStatus({ tone: "success", text: "To już Twój aktualny avatar." });
      return;
    }

    setProgress("saving");
    setStatus({ tone: "neutral", text: "Zapisuję zmiany…" });

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_type: "icon", avatar_path: presetId })
      .eq("id", userId);

    if (error) {
      setStatus({
        tone: "error",
        text:
          "Nie udało się zapisać ikonki. Spróbuj ponownie lub wybierz inną opcję.",
      });
      setProgress("idle");
      return;
    }

    onAvatarChange({
      type: "icon",
      path: presetId,
      imageUrl: null,
      error: null,
    });
    setStatus({ tone: "success", text: "Zmieniono avatar." });
    setProgress("idle");
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Allow re-selecting the same file later.
    event.target.value = "";

    if (!file) {
      return;
    }

    if (progress !== "idle") {
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus({
        tone: "error",
        text: "Plik jest za duży. Maksymalny rozmiar to 2MB.",
      });
      return;
    }

    setProgress("uploading");
    setStatus({ tone: "neutral", text: "Wysyłam plik…" });

    const storagePath = buildUniqueFilePath(userId, file.name);
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setStatus({
        tone: "error",
        text:
          "Nie udało się wgrać pliku. Upewnij się, że masz dostęp do internetu i spróbuj ponownie.",
      });
      setProgress("idle");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_type: "upload", avatar_path: storagePath })
      .eq("id", userId);

    if (updateError) {
      setStatus({
        tone: "error",
        text: "Nie udało się zapisać avatara. Spróbuj ponownie później.",
      });
      setProgress("idle");
      return;
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("avatars")
      .createSignedUrl(storagePath, SIGNED_URL_LIFETIME_SECONDS);

    const signedUrl = signedUrlData?.signedUrl ?? null;

    onAvatarChange({
      type: "upload",
      path: storagePath,
      imageUrl: signedUrl,
      error: signedUrlError ? signedUrlError.message : null,
    });

    if (signedUrlError) {
      setStatus({
        tone: "error",
        text: "Avatar został zapisany, ale nie udało się wygenerować podglądu.",
      });
      setProgress("idle");
      return;
    }

    setStatus({ tone: "success", text: "Nowy avatar jest gotowy!" });
    setProgress("idle");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {AVATAR_PRESETS.map((preset) => {
          const isActive =
            currentAvatarType === "icon" && normalizedPath === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={progress !== "idle"}
              className={clsx(
                "inline-flex size-12 items-center justify-center rounded-full border px-0 text-xl transition",
                "border-black/10 text-black hover:border-black/30 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10",
                isActive &&
                  "border-black/50 bg-black/5 dark:border-white/50 dark:bg-white/10",
                progress !== "idle" && "opacity-60",
              )}
              onClick={() => handlePresetSelection(preset.id)}
            >
              <span aria-hidden="true">{preset.icon}</span>
              <span className="sr-only">Wybierz ikonę {preset.label}</span>
            </button>
          );
        })}

        <label
          className={clsx(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            "border-black/10 text-black hover:border-black/30 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10",
            progress !== "idle" && "opacity-60",
          )}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={progress !== "idle"}
          />
          <span>Wgraj własne logo</span>
        </label>
      </div>

      <p className="text-xs text-black/50 dark:text-white/50">
        Obsługiwane formaty: PNG, JPG, GIF i WebP. Maksymalnie 2MB.
      </p>

      {status ? (
        <p
          className={clsx("text-sm", {
            "text-emerald-600 dark:text-emerald-400": status.tone === "success",
            "text-red-600 dark:text-red-400": status.tone === "error",
            "text-black/60 dark:text-white/60": status.tone === "neutral",
          })}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
