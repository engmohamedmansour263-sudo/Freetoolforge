import { prisma } from '@/lib/db';
import { analyzeKeywordOpportunity, buildKeywordBlueprint } from '@/lib/seo/tool-autopilot';
import type { SearchConsoleKeyword } from '@/lib/seo/search-console';

export async function persistSearchConsoleRows(rows: SearchConsoleKeyword[]) {
  const totals = { processed: 0, ready: 0, review: 0, unsupported: 0 };
  for (let offset = 0; offset < rows.length; offset += 500) {
    for (const signal of rows.slice(offset, offset + 500)) {
      const keyword = signal.keyword.trim().replace(/\s+/g, ' ');
      const blueprint = buildKeywordBlueprint({ ...signal, source: 'search-console' });
      if (!blueprint) { totals.processed++; totals.unsupported++; continue; }
      const analysis = analyzeKeywordOpportunity(signal);
      const normalized = keyword.toLocaleLowerCase();
      const status = blueprint.supported ? 'READY_TO_GENERATE' : 'REVIEW_REQUIRED';
      const notes = `Priority: ${analysis.priority}/100; CTR: ${analysis.ctr}%; type: ${analysis.opportunityType}. ${analysis.recommendation} ${blueprint.reason ?? ''}`;
      const existing = await prisma.sEOKeywordOpportunity.findUnique({ where: { normalized }, select: { status: true, generatedToolId: true } });
      const preserveStatus = existing && (existing.generatedToolId || ['PUBLISHED', 'CANDIDATE_CREATED'].includes(existing.status)) ? existing.status : status;
      await prisma.sEOKeywordOpportunity.upsert({
        where: { normalized },
        create: { keyword, normalized, source: 'search-console', impressions: signal.impressions, clicks: signal.clicks, position: signal.position, status, suggestedSlug: blueprint.slug, notes },
        update: { impressions: signal.impressions, clicks: signal.clicks, position: signal.position, source: 'search-console', suggestedSlug: blueprint.slug, notes, status: preserveStatus },
      });
      if (blueprint.supported) totals.ready++; else totals.review++;
      totals.processed++;
    }
  }
  return totals;
}
