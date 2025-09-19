export type AccountType = "admin" | "carpenter" | "client";

export function getAccountTypeIcon(accountType: AccountType | null | undefined) {
  switch (accountType) {
    case "admin":
      return "⚙️";
    case "carpenter":
      return "🪛";
    case "client":
    default:
      return "👤";
  }
}
