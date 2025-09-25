import { CarpenterSubscriptionPlan, ClientSubscriptionPlan, UserRole } from '@/lib/domain';

function generateAffiliateCode() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without Web Crypto (should not happen in Next.js runtimes)
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0');
}

export function resolveCarpenterMetadata() {
  const affiliateCode = generateAffiliateCode();
  return {
    role: UserRole.CARPENTER,
    subscriptionPlan: CarpenterSubscriptionPlan.PROFESSIONAL,
    affiliateCode,
  } satisfies Record<string, unknown>;
}

export function resolveClientMetadata(plan: ClientSubscriptionPlan, invitedBy?: string | null) {
  const baseMetadata = {
    role: UserRole.CLIENT,
    subscriptionPlan: plan,
    projectLimit: plan === ClientSubscriptionPlan.FREE ? 2 : null,
  } satisfies Record<string, unknown>;

  if (invitedBy) {
    return { ...baseMetadata, invitedBy };
  }
  return baseMetadata;
}
