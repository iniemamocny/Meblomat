export type AvatarType = "icon" | "upload";

export type AvatarPreset = {
  id: string;
  label: string;
  icon: string;
};

export const DEFAULT_AVATAR_ID = "user";

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "user", label: "Classic", icon: "👤" },
  { id: "hammer", label: "Workshop", icon: "🔨" },
  { id: "sparkles", label: "Spark", icon: "✨" },
  { id: "leaf", label: "Nature", icon: "🍃" },
  { id: "compass", label: "Navigator", icon: "🧭" },
  { id: "lightbulb", label: "Idea", icon: "💡" },
];

export function getAvatarPresetIcon(id: string | null | undefined) {
  const preset = AVATAR_PRESETS.find((item) => item.id === id);

  if (preset) {
    return preset.icon;
  }

  return AVATAR_PRESETS[0]?.icon ?? "👤";
}
