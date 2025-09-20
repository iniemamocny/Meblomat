/* @vitest-environment jsdom */

import type { AuthError } from "@supabase/supabase-js";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  replaceMock,
  refreshMock,
  isSupabaseConfiguredOnClientMock,
  createSupabaseBrowserClientMock,
} = vi.hoisted(() => {
  return {
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
    isSupabaseConfiguredOnClientMock: vi.fn(),
    createSupabaseBrowserClientMock: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/envClient", () => ({
  isSupabaseConfiguredOnClient: isSupabaseConfiguredOnClientMock,
}));

vi.mock("@/lib/supabaseClient", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

describe("verifyEmailChangeRequest", () => {
  it("invokes Supabase with the provided token hash", async () => {
    const verifyOtp = vi.fn(async () => ({
      data: null,
      error: null as AuthError | null,
    }));
    const supabase = { auth: { verifyOtp } };

    const { verifyEmailChangeRequest } = await import("./VerificationHandler");

    await verifyEmailChangeRequest(
      supabase as Parameters<typeof verifyEmailChangeRequest>[0],
      "token-hash",
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      type: "email_change",
      token_hash: "token-hash",
    });
  });
});

describe("VerificationHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredOnClientMock.mockReturnValue(true);
    createSupabaseBrowserClientMock.mockReset();
  });

  it("promotes pending carpenter accounts when verifying with a token hash", async () => {
    const verifyOtp = vi.fn(async () => ({
      data: {
        user: {
          id: "user-123",
          user_metadata: {
            pending_account_type: "carpenter",
          },
        },
      },
      error: null,
    }));
    const exchangeCodeForSession = vi.fn();
    const getUser = vi.fn();
    const updateUser = vi.fn(async () => ({ data: null, error: null }));
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "promote_to_carpenter") {
        return {
          data: { account_type: "carpenter" },
          error: null,
        };
      }

      return { data: null, error: null };
    });

    const supabase = {
      auth: {
        verifyOtp,
        exchangeCodeForSession,
        getUser,
        updateUser,
      },
      rpc,
    };

    createSupabaseBrowserClientMock.mockReturnValue(supabase);

    const { VerificationHandler } = await import("./VerificationHandler");

    render(<VerificationHandler tokenHash="token-hash" type="invite" />);

    await waitFor(() => {
      expect(verifyOtp).toHaveBeenCalledWith({
        type: "invite",
        token_hash: "token-hash",
      });
    });

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("promote_to_carpenter");
    });

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({
      data: { pending_account_type: null },
    });
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("promotes pending carpenter accounts using metadata from getUser when verifyOtp metadata is empty", async () => {
    const verifyOtp = vi.fn(async () => ({
      data: {
        user: {
          id: "user-123",
          user_metadata: {},
        },
      },
      error: null,
    }));
    const exchangeCodeForSession = vi.fn();
    const getUser = vi.fn(async () => ({
      data: {
        user: {
          id: "user-123",
          user_metadata: {
            pending_account_type: "carpenter",
          },
        },
      },
      error: null,
    }));
    const updateUser = vi.fn(async () => ({ data: null, error: null }));
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "promote_to_carpenter") {
        return {
          data: { account_type: "carpenter" },
          error: null,
        };
      }

      return { data: null, error: null };
    });

    const supabase = {
      auth: {
        verifyOtp,
        exchangeCodeForSession,
        getUser,
        updateUser,
      },
      rpc,
    };

    createSupabaseBrowserClientMock.mockReturnValue(supabase);

    const { VerificationHandler } = await import("./VerificationHandler");

    render(<VerificationHandler tokenHash="token-hash" type="invite" />);

    await waitFor(() => {
      expect(verifyOtp).toHaveBeenCalledWith({
        type: "invite",
        token_hash: "token-hash",
      });
    });

    await waitFor(() => {
      expect(getUser).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("promote_to_carpenter");
    });

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({
      data: { pending_account_type: null },
    });
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalled();
  });
});
