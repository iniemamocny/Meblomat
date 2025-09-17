import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectRecord = {
  id: string;
  carpenterId: string;
  clientId: string;
  title: string;
  details: string | null;
  status: string;
  submittedAt: string;
  updatedAt: string | null;
};

export async function submitProjectBrief(
  supabase: SupabaseClient,
  carpenterId: string,
  title: string,
  details: string,
) {
  const { data, error } = await supabase.rpc("submit_project_brief", {
    target_carpenter: carpenterId,
    project_title: title,
    project_details: details,
  });

  if (error) {
    throw error;
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (!record) {
    throw new Error("Project submission failed.");
  }

  return {
    id: record.project_id as string,
    carpenterId: record.carpenter_id as string,
    clientId: record.client_id as string,
    status: record.status as string,
    submittedAt: record.submitted_at as string,
  };
}

export async function fetchProjectsForCarpenter(
  supabase: SupabaseClient,
  carpenterId: string,
) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, carpenter_id, client_id, title, details, status, submitted_at, updated_at")
    .eq("carpenter_id", carpenterId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((record) => ({
    id: record.id as string,
    carpenterId: record.carpenter_id as string,
    clientId: record.client_id as string,
    title: record.title as string,
    details: (record.details as string | null) ?? null,
    status: record.status as string,
    submittedAt: record.submitted_at as string,
    updatedAt: (record.updated_at as string | null) ?? null,
  } satisfies ProjectRecord));
}

export async function fetchProjectsForClient(
  supabase: SupabaseClient,
  clientId: string,
) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, carpenter_id, client_id, title, details, status, submitted_at, updated_at")
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((record) => ({
    id: record.id as string,
    carpenterId: record.carpenter_id as string,
    clientId: record.client_id as string,
    title: record.title as string,
    details: (record.details as string | null) ?? null,
    status: record.status as string,
    submittedAt: record.submitted_at as string,
    updatedAt: (record.updated_at as string | null) ?? null,
  } satisfies ProjectRecord));
}
