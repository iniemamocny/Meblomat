import type { AccountType } from "@/lib/avatar";
import { ProtectedFeaturePage, UnauthorizedNotice } from "@/components/protected/ProtectedFeaturePage";
import { requireAuthenticatedUser } from "@/lib/serverAuth";

const allowedAccountTypes: AccountType[] = ["admin", "carpenter"];

export default async function WycenaPage() {
  const { accountType } = await requireAuthenticatedUser();
  const canAccess = accountType ? allowedAccountTypes.includes(accountType) : false;

  if (!canAccess) {
    return <UnauthorizedNotice />;
  }

  return <ProtectedFeaturePage featureKey="wycena" />;
}
