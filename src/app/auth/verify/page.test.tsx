/* @vitest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type VerificationHandlerProps = {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
  redirectPath?: string;
};

const {
  redirectMock,
  replaceMock,
  refreshMock,
  isSupabaseConfiguredMock,
  createSupabaseBrowserClientMock,
  getUserMock,
  verificationHandlerMock,
  authFormMock,
} = vi.hoisted(() => {
  const redirect = vi.fn();
  const replace = vi.fn();
  const refresh = vi.fn();
  const isSupabaseConfigured = vi.fn();
  const getUser = vi.fn();
  const createSupabaseBrowserClient = vi.fn();
  const verificationHandler = vi.fn();
  const authForm = vi.fn();

  return {
    redirectMock: redirect,
    replaceMock: replace,
    refreshMock: refresh,
    isSupabaseConfiguredMock: isSupabaseConfigured,
    createSupabaseBrowserClientMock: createSupabaseBrowserClient,
    getUserMock: getUser,
    verificationHandlerMock: verificationHandler,
    authFormMock: authForm,
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/envClient", () => ({
  isSupabaseConfiguredOnClient: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/supabaseClient", () => ({
  createSupabaseBrowserClient: createSupabaseBrowserClientMock,
}));

vi.mock("@/components/auth/VerificationHandler", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/auth/VerificationHandler")
  >("@/components/auth/VerificationHandler");

  return {
    ...actual,
    VerificationHandler: (props: VerificationHandlerProps) => {
      verificationHandlerMock(props);
      return <div data-testid="verification-handler" />;
    },
  };
});

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: (props: unknown) => {
    authFormMock(props);
    return <div data-testid="auth-form" />;
  },
}));

import VerifyPage from "./page";

describe("VerifyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({ data: { user: null } });
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
  });

  it("renders a Supabase configuration warning when env vars are missing", () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    render(<VerifyPage />);

    expect(
      screen.queryByText(
        "Add your Supabase credentials to complete email verification flows.",
      ),
    ).not.toBeNull();
    expect(createSupabaseBrowserClientMock).not.toHaveBeenCalled();
    expect(verificationHandlerMock).not.toHaveBeenCalled();
  });

  it("redirects signed-in users when no verification payload is present", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    render(<VerifyPage />);

    await waitFor(() => {
      expect(getUserMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });

    expect(verificationHandlerMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        code: null,
        tokenHash: null,
        type: null,
      }),
    );
  });

  it("renders the verification handler when the verification params are present", async () => {
    window.history.pushState(
      null,
      "",
      "/auth/verify?code=test-token&type=email_change",
    );

    render(<VerifyPage />);

    await waitFor(() => {
      expect(verificationHandlerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "test-token",
          tokenHash: null,
          type: "email_change",
        }),
      );
    });

    expect(getUserMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("promotes pending carpenter accounts when the manual OTP form completes", async () => {
    const updateUser = vi.fn(async () => ({ data: null, error: null }));
    const rpc = vi.fn(async (fn: string, params?: Record<string, unknown>) => {
      if (fn === "promote_to_carpenter") {
        return {
          data: { account_type: "carpenter" },
          error: null,
        };
      }

      if (fn === "accept_carpenter_invitation") {
        expect(params).toEqual({ invitation_token: "invite-123" });

        return { data: null, error: null };
      }

      return { data: null, error: null };
    });
    const supabase = {
      auth: {
        getUser: getUserMock,
        updateUser,
      },
      rpc,
    };

    createSupabaseBrowserClientMock.mockReturnValue(supabase);

    render(<VerifyPage />);

    const authFormProps = authFormMock.mock.calls.at(-1)?.[0] as {
      onSignedIn?: (args: unknown) => unknown;
    };

    expect(authFormProps?.onSignedIn).toBeTypeOf("function");

    await authFormProps?.onSignedIn?.({
      session: {
        user: {
          id: "user-123",
          user_metadata: {
            pending_account_type: "carpenter",
            pending_invitation_token: "invite-123",
          },
        },
      },
      supabase,
    });

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("promote_to_carpenter");
    });

    expect(rpc).toHaveBeenCalledWith("accept_carpenter_invitation", {
      invitation_token: "invite-123",
    });
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        pending_account_type: null,
        pending_invitation_token: null,
      },
    });
  });
});
