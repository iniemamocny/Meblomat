/* @vitest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translations } from "@/lib/i18n";

const {
  replaceMock,
  refreshMock,
  isSupabaseConfiguredMock,
  createSupabaseBrowserClientMock,
  getUserMock,
  authFormMock,
} = vi.hoisted(() => {
  return {
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
    isSupabaseConfiguredMock: vi.fn(),
    createSupabaseBrowserClientMock: vi.fn(),
    getUserMock: vi.fn(),
    authFormMock: vi.fn(() => <div data-testid="auth-form" />),
  };
});

vi.mock("next/navigation", () => ({
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

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: (props: unknown) => authFormMock(props),
}));

vi.mock("@/components/providers/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" as const }),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({ data: { user: null } });
    createSupabaseBrowserClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
      },
    });
  });

  it("renders the login form without Supabase sign-up links", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      expect(getUserMock).toHaveBeenCalledTimes(1);
      expect(authFormMock).toHaveBeenCalledTimes(1);
    });

    expect(authFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        view: "sign_in",
        showLinks: false,
      }),
    );

    const registerLink = screen.getByRole("link", {
      name: translations.en.auth.login.registerLinkLabel,
    });
    expect(registerLink.getAttribute("href")).toBe("/auth/register");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
  });
});
