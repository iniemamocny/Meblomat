/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

const { replaceMock, refreshMock, searchParamsMock } = vi.hoisted(() => {
  return {
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
    searchParamsMock: {
      get: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

import { SignUpForm } from "./SignUpForm";

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockImplementation((key: string) => {
      if (key === "invitation") {
        return "invite-token";
      }

      return null;
    });
  });

  it("shows confirmation and skips restricted updates when no session is returned", async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: {
        user: { id: "user-123" },
        session: null,
      },
      error: null,
    });
    const eqMock = vi.fn(() => Promise.resolve({ error: null }));
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ update: updateMock }));
    const rpcMock = vi.fn(() => Promise.resolve({ error: null }));

    const supabase = {
      auth: { signUp: signUpMock },
      from: fromMock,
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    render(<SignUpForm supabase={supabase} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledTimes(1);
    });

    const signUpArgs = signUpMock.mock.calls.at(0)?.[0];
    expect(signUpArgs?.options?.data).toMatchObject({
      pending_account_type: "client",
      pending_invitation_token: "invite-token",
    });

    expect(fromMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();

    const confirmationMessage = await screen.findByText(
      "Check your email for a confirmation link to finish setting up your account.",
    );
    expect(confirmationMessage).toBeTruthy();

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
