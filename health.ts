import type { AIProviderId } from './types';

const failures = new Map<AIProviderId, { count: number; openedAt: number }>();
const FAILURE_THRESHOLD = Number(process.env.AI_CIRCUIT_FAILURE_THRESHOLD || 3);
const OPEN_MS = Number(process.env.AI_CIRCUIT_OPEN_MS || 60_000);

export function isCircuitOpen(provider: AIProviderId): boolean {
  const state = failures.get(provider);
  if (!state || state.count < FAILURE_THRESHOLD) return false;
  if (Date.now() - state.openedAt >= OPEN_MS) {
    failures.delete(provider); // half-open: allow one probe
    return false;
  }
  return true;
}
export function recordProviderSuccess(provider: AIProviderId): void { failures.delete(provider); }
export function recordProviderFailure(provider: AIProviderId): void {
  const prior = failures.get(provider);
  const count = (prior?.count ?? 0) + 1;
  failures.set(provider, { count, openedAt: count >= FAILURE_THRESHOLD ? (prior?.openedAt ?? Date.now()) : 0 });
}
export function getCircuitSnapshot() {
  return [...failures.entries()].map(([provider, state]) => ({ provider, failures: state.count, open: isCircuitOpen(provider), retryAfterMs: state.count >= FAILURE_THRESHOLD ? Math.max(0, OPEN_MS - (Date.now() - state.openedAt)) : 0 }));
}
