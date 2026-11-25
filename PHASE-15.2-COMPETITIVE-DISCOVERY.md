# Phase 15.2 — Competitive Opportunity Analysis

## Purpose
Rank tool opportunities using actual supplied Search Console signals and explicit competitor observations. The engine intentionally does not invent search volume, competitor URLs, pricing, or revenue.

## API

### POST `/api/admin/discovery/competitive`
Admin-only. Example:

```json
{
  "keyword": "json formatter",
  "impressions": 1500,
  "clicks": 12,
  "position": 9,
  "source": "manual-serp",
  "competitors": [
    {
      "title": "Example formatter",
      "url": "https://example.com/formatter",
      "toolLike": true,
      "missingFeatures": ["batch processing", "offline mode"]
    }
  ]
}
```

Competitor observations are capped at 20. Only HTTP(S) URLs are accepted by the analyzer. The endpoint stores the result in `OpportunityCandidate` and records an audit event. It does not automatically enqueue or publish a tool.

### GET `/api/admin/discovery/report`
Admin-only. Returns the 20 highest-scoring candidates updated in the last seven days and counts by candidate status for the same period.

## Scoring
- Demand score: bounded heuristic based on supplied impressions and observed CTR.
- Gap score: rewards documented feature gaps and discounts a larger number of tool-like competitors.
- Final score: 45% demand, 35% gap, 20% existing discovery-engine score.
- Competition level is based on the count of observations explicitly marked `toolLike`.

These are prioritization heuristics, not estimates of revenue, traffic, or ranking probability. Missing SERP observations must remain missing; they are not interpreted as proof of low competition.

## Operational limitations
No SERP scraper/provider is bundled. Integrate a licensed/trusted SERP source or submit verified observations. Keep provider credentials server-side and apply provider-specific rate limits before enabling scheduled collection.
