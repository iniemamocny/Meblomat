import type { SupabaseClient } from "@supabase/supabase-js";

import type { AvatarType } from "./avatar";

export type CarpenterClient = {
  clientId: string;
  clientEmail: string | null;
  avatarType: AvatarType | null;
  avatarPath: string | null;
};

export type AssignedCarpenter = {
  carpenterId: string;
  carpenterEmail: string | null;
  avatarType: AvatarType | null;
  avatarPath: string | null;
};

export type ActiveCarpenter = {
  carpenterId: string;
  carpenterEmail: string | null;
  avatarType: AvatarType | null;
  avatarPath: string | null;
  subscriptionExpiresAt: string | null;
};

export async function listCarpenterClients(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_carpenter_clients");

  if (error) {
    throw error;
  }

  return (data ?? []).map((entry) => ({
    clientId: entry.client_id as string,
    clientEmail: (entry.client_email as string | null) ?? null,
    avatarType: (entry.avatar_type as AvatarType | null) ?? null,
    avatarPath: (entry.avatar_path as string | null) ?? null,
  } satisfies CarpenterClient));
}

export async function getAssignedCarpenter(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_assigned_carpenter");

  if (error) {
    throw error;
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (!record) {
    return null;
  }

  return {
    carpenterId: record.carpenter_id as string,
    carpenterEmail: (record.carpenter_email as string | null) ?? null,
    avatarType: (record.avatar_type as AvatarType | null) ?? null,
    avatarPath: (record.avatar_path as string | null) ?? null,
  } satisfies AssignedCarpenter;
}

export async function listActiveCarpenters(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_active_carpenters");

  if (error) {
    throw error;
  }

  return (data ?? []).map((record) => ({
    carpenterId: record.carpenter_id as string,
    carpenterEmail: (record.carpenter_email as string | null) ?? null,
    avatarType: (record.avatar_type as AvatarType | null) ?? null,
    avatarPath: (record.avatar_path as string | null) ?? null,
    subscriptionExpiresAt: (record.subscription_expires_at as string | null) ?? null,
  } satisfies ActiveCarpenter));
}
