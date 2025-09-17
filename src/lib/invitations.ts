import type { SupabaseClient } from "@supabase/supabase-js";

export type InvitationDetails = {
  token: string;
  carpenterId: string;
  carpenterEmail: string | null;
  invitedEmail: string;
  expiresAt: string;
  acceptedAt: string | null;
};

export async function generateInvitation(
  supabase: SupabaseClient,
  carpenterId: string,
  invitedEmail: string,
  expiresAt: Date,
) {
  const { data, error } = await supabase
    .from("carpenter_invitations")
    .insert({
      carpenter_id: carpenterId,
      invited_email: invitedEmail,
      expires_at: expiresAt.toISOString(),
    })
    .select("token, invited_email, expires_at, accepted_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    token: data.token as string,
    invitedEmail: data.invited_email as string,
    expiresAt: data.expires_at as string,
    acceptedAt: data.accepted_at as string | null,
  };
}

export async function getInvitationDetails(
  supabase: SupabaseClient,
  token: string,
): Promise<InvitationDetails> {
  const { data, error } = await supabase.rpc("validate_carpenter_invitation", {
    invitation_token: token,
  });

  if (error) {
    throw error;
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (!record) {
    throw new Error("Invitation is no longer available.");
  }

  return {
    token: record.token as string,
    carpenterId: record.carpenter_id as string,
    carpenterEmail: (record.carpenter_email as string | null) ?? null,
    invitedEmail: record.invited_email as string,
    expiresAt: record.expires_at as string,
    acceptedAt: record.accepted_at as string | null,
  };
}

export async function acceptInvitation(
  supabase: SupabaseClient,
  token: string,
) {
  const { data, error } = await supabase.rpc("accept_carpenter_invitation", {
    invitation_token: token,
  });

  if (error) {
    throw error;
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (!record) {
    return null;
  }

  return {
    carpenterId: record.carpenter_id as string,
    clientId: record.client_id as string,
  };
}
