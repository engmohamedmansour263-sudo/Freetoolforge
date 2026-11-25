/** Safe JSON-LD renderer. Escape '<' to prevent script-tag injection from data. */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialized }} />;
}
