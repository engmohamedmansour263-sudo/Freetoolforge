export type SEOFields = { title: string; description: string };

/** Applies only the two SEO metadata fields and preserves every other manifest key. */
export function mergeSEOIntoManifest(manifest: unknown, seo: SEOFields): Record<string, unknown> {
  const root = manifest && typeof manifest === 'object' && !Array.isArray(manifest)
    ? { ...(manifest as Record<string, unknown>) }
    : {};
  const currentSEO = root.seo && typeof root.seo === 'object' && !Array.isArray(root.seo)
    ? { ...(root.seo as Record<string, unknown>) }
    : {};
  root.seo = { ...currentSEO, title: seo.title.trim(), description: seo.description.trim() };
  return root;
}

export function nextToolVersion(currentVersion: number): number {
  if (!Number.isInteger(currentVersion) || currentVersion < 1) throw new Error('Invalid tool version');
  return currentVersion + 1;
}
