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
} = vi.hoisted(() => {
  const redirect = vi.fn();
  const replace = vi.fn();
  const refresh = vi.fn();
  const isSupabaseConfigured = vi.fn();
  const getUser = vi.fn();
  const supabaseClient = { auth: { getUser } };
  const createSupabaseBrowserClient = vi.fn(() => supabaseClient);
  const verificationHandler = vi.fn();

  return {
    redirectMock: redirect,
    replaceMock: replace,
    refreshMock: refresh,
    isSupabaseConfiguredMock: isSupabaseConfigured,
    createSupabaseBrowserClientMock: createSupabaseBrowserClient,
    getUserMock: getUser,
    verificationHandlerMock: verificationHandler,
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

vi.mock("@/components/auth/VerificationHandler", () => ({
  VerificationHandler: (props: VerificationHandlerProps) => {
    verificationHandlerMock(props);
    return <div data-testid="verification-handler" />;
  },
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: () => <div data-testid="auth-form" />,
}));

import VerifyPage from "./page";

describe("VerifyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({ data: { user: null } });
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
});
