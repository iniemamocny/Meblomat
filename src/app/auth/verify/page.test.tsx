import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, getSupabaseConfigMock, getUserMock, createSupabaseServerClientMock } = vi.hoisted(() => {
  const getUser = vi.fn();

  return {
    redirectMock: vi.fn(() => {
      throw new Error("REDIRECT");
    }),
    getSupabaseConfigMock: vi.fn(),
    getUserMock: getUser,
    createSupabaseServerClientMock: vi.fn(() => ({
      auth: {
        getUser,
      },
    })),
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("@/lib/env", () => ({
  getSupabaseConfig: getSupabaseConfigMock,
}));

vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { VerificationHandler } from "@/components/auth/VerificationHandler";
import VerifyPage from "./page";

describe("VerifyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseConfigMock.mockReturnValue({ url: "https://example.com" });
  });

  it("redirects signed-in users when no verification payload is present", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    await expect(VerifyPage({ searchParams: {} })).rejects.toThrowError("REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the verification handler for email change links when the user is already signed in", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const element = await VerifyPage({
      searchParams: {
        code: "test-token",
        type: "email_change",
      },
    });

    expect(redirectMock).not.toHaveBeenCalled();

    const verificationElement = findVerificationHandler(element);
    expect(verificationElement).not.toBeNull();
    expect(verificationElement?.props.code).toBe("test-token");
    expect(verificationElement?.props.tokenHash).toBeNull();
    expect(verificationElement?.props.type).toBe("email_change");
  });

  it("renders the verification handler when only a token hash is provided", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const element = await VerifyPage({
      searchParams: {
        token_hash: "test-token-hash",
        type: "email_change",
      },
    });

    expect(redirectMock).not.toHaveBeenCalled();

    const verificationElement = findVerificationHandler(element);
    expect(verificationElement).not.toBeNull();
    expect(verificationElement?.props.code).toBeNull();
    expect(verificationElement?.props.tokenHash).toBe("test-token-hash");
    expect(verificationElement?.props.type).toBe("email_change");
  });
});

function findVerificationHandler(node: ReactNode): ReactElement | null {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findVerificationHandler(child);
      if (match) {
        return match;
      }
    }
    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === VerificationHandler) {
    return node;
  }

  const children = Children.toArray(node.props?.children ?? []);
  for (const child of children) {
    const match = findVerificationHandler(child);
    if (match) {
      return match;
    }
  }

  return null;
}
