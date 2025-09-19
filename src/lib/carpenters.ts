import type { SupabaseClient } from "@supabase/supabase-js";

export type CarpenterClient = {
  clientId: string;
  clientEmail: string | null;
};

export type AssignedCarpenter = {
  carpenterId: string;
  carpenterEmail: string | null;
};

export type ActiveCarpenter = {
  carpenterId: string;
  carpenterEmail: string | null;
  subscriptionExpiresAt: string | null;
};

export async function getCarpenterReferralLink(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_carpenter_referral_link");

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Referral link is not available yet.");
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    const record = data[0];

    if (!record) {
      throw new Error("Referral link is not available yet.");
    }

    if (typeof record === "string") {
      return record;
    }

    if (
      record &&
      typeof record === "object" &&
      "referral_token" in record &&
      typeof (record as Record<string, unknown>).referral_token === "string"
    ) {
      return (record as Record<string, string>).referral_token;
    }
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "referral_token" in data &&
    typeof (data as Record<string, unknown>).referral_token === "string"
  ) {
    return (data as Record<string, string>).referral_token;
  }

  throw new Error("Referral link is not available yet.");
}

export async function listCarpenterClients(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_carpenter_clients");

  if (error) {
    throw error;
  }

  return (data ?? []).map((entry: Record<string, unknown>) => ({
    clientId: entry.client_id as string,
    clientEmail: (entry.client_email as string | null) ?? null,
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
  } satisfies AssignedCarpenter;
}

export async function listActiveCarpenters(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_active_carpenters");

  if (error) {
    throw error;
  }

  return (data ?? []).map((record: Record<string, unknown>) => ({
    carpenterId: record.carpenter_id as string,
    carpenterEmail: (record.carpenter_email as string | null) ?? null,
    subscriptionExpiresAt: (record.subscription_expires_at as string | null) ?? null,
  } satisfies ActiveCarpenter));
}
