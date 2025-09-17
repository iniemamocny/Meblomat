import type { AuthError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { verifyEmailChangeRequest } from "./VerificationHandler";

describe("verifyEmailChangeRequest", () => {
  it("invokes Supabase with the provided token hash", async () => {
    const verifyOtp = vi.fn(async () => ({
      data: null,
      error: null as AuthError | null,
    }));
    const supabase = { auth: { verifyOtp } } as Parameters<
      typeof verifyEmailChangeRequest
    >[0];

    await verifyEmailChangeRequest(supabase, "token-hash");

    expect(verifyOtp).toHaveBeenCalledWith({
      type: "email_change",
      token_hash: "token-hash",
    });
  });
});
