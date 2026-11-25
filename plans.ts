export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type Plan = { id: PlanId; monthlyPriceUsd: number | null; monthlyCredits: number; ads: boolean; features: string[] };

/** Commercial price hypotheses for validation, not active billing offers. */
export const plans: Record<PlanId, Plan> = {
  free: { id: 'free', monthlyPriceUsd: 0, monthlyCredits: 500, ads: true, features: ['Core browser tools', 'Basic templates', 'Limited monthly AI usage'] },
  starter: { id: 'starter', monthlyPriceUsd: 5.99, monthlyCredits: 2500, ads: false, features: ['Everything in Free', 'Premium PDF workflows', 'More monthly credits', 'No ads'] },
  pro: { id: 'pro', monthlyPriceUsd: 12.99, monthlyCredits: 10000, ads: false, features: ['Everything in Starter', 'AI document assistant', 'Privacy and security tools', 'Premium content workflows'] },
  business: { id: 'business', monthlyPriceUsd: 39, monthlyCredits: 50000, ads: false, features: ['Everything in Pro', 'Team-ready workflows', 'Higher usage allowance', 'Business API preview access'] },
  enterprise: { id: 'enterprise', monthlyPriceUsd: null, monthlyCredits: -1, ads: false, features: ['Custom usage and contracts', 'Integration planning', 'Administrative controls', 'Security review and support'] },
};

export const billingStatus = 'preview' as const;

function isValidCreditCount(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Quota policy check only; it does not reserve or charge credits. */
export function hasQuota(planId: PlanId, usedCredits: number, requestedCredits = 1) {
  if (!isValidCreditCount(usedCredits) || !Number.isSafeInteger(requestedCredits) || requestedCredits < 1) return false;
  const plan = plans[planId];
  if (!plan) return false;
  return plan.monthlyCredits === -1 || usedCredits + requestedCredits <= plan.monthlyCredits;
}
export function getRemainingCredits(planId: PlanId, usedCredits: number) {
  if (!isValidCreditCount(usedCredits)) return 0;
  const cap = plans[planId]?.monthlyCredits;
  if (cap === undefined) return 0;
  return cap === -1 ? null : Math.max(0, cap - usedCredits);
}
