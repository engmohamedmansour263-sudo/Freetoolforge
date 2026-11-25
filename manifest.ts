import { z } from 'zod';

const localizedText = z.object({ en: z.string(), ar: z.string(), hi: z.string(), bn: z.string() }).strict();
const localeContent = z.object({
  en: z.object({ intro: z.string(), howTo: z.array(z.string()) }).strict(),
  ar: z.object({ intro: z.string(), howTo: z.array(z.string()) }).strict(),
  hi: z.object({ intro: z.string(), howTo: z.array(z.string()) }).strict(),
  bn: z.object({ intro: z.string(), howTo: z.array(z.string()) }).strict(),
}).strict();

export const ToolStatusSchema = z.enum(['draft','generating','testing','review','published','archived','failed']);
export const ToolManifestSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(20).max(500),
  category: z.string().min(2).max(60),
  keywords: z.array(z.string().min(1).max(60)).max(30),
  kind: z.string().min(1).max(60),
  version: z.number().int().positive().default(1),
  status: ToolStatusSchema.default('draft'),
  seo: z.object({ title: z.string().min(10).max(70), description: z.string().min(50).max(170), canonical: z.string().url().optional() }),
  faq: z.array(z.object({ question: z.string().min(5), answer: z.string().min(10) })).max(20).default([]),
  examples: z.array(z.object({ input: z.string(), output: z.string() })).max(10).default([]),
  instructions: z.array(z.string().min(3)).max(20).default([]),
  // Optional factory metadata; the runtime still executes only the trusted `kind` processor.
  inputs: z.array(z.object({ id: z.enum(['input', 'extra']), type: z.enum(['textarea', 'text']), required: z.boolean(), label: localizedText, placeholder: localizedText }).strict()).optional(),
  output: z.object({ type: z.literal('text'), label: localizedText, copyable: z.literal(true) }).strict().optional(),
  localizedSeo: z.object({
    en: z.object({ title: z.string(), description: z.string() }).strict(),
    ar: z.object({ title: z.string(), description: z.string() }).strict(),
    hi: z.object({ title: z.string(), description: z.string() }).strict(),
    bn: z.object({ title: z.string(), description: z.string() }).strict(),
  }).strict().optional(),
  localizedContent: localeContent.optional(),
  safety: z.object({ processor: z.literal('reviewed-built-in'), arbitraryCode: z.literal(false), networkAccess: z.literal(false), fileAccess: z.literal(false) }).strict().optional(),
  quality: z.object({ score: z.number().int().min(0).max(100), passed: z.boolean(), checks: z.array(z.object({ id: z.string(), passed: z.boolean(), message: z.string() }).strict()) }).strict().optional(),
}).strict();

export type ToolManifest = z.infer<typeof ToolManifestSchema>;
export function validateToolManifest(value: unknown) {
  return ToolManifestSchema.safeParse(value);
}
