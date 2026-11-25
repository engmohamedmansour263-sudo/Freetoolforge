type Entry<T> = { value: T; expiresAt: number };
/** Small process-local TTL cache. Replace with shared Redis/KV for multi-instance deployments. */
export class TTLCache<T> {
  private entries = new Map<string, Entry<T>>();
  constructor(private readonly maxEntries = 500) {}
  get(key: string, now = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) { this.entries.delete(key); return undefined; }
    return entry.value;
  }
  set(key: string, value: T, ttlMs: number, now = Date.now()) {
    if (ttlMs <= 0) { this.delete(key); return; }
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: now + ttlMs });
  }
  delete(key: string) { return this.entries.delete(key); }
  clear() { this.entries.clear(); }
  get size() { return this.entries.size; }
}
