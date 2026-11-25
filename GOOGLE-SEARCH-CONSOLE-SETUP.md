# Google Search Console connection

FreeToolForge reads Search Analytics data with a Google Cloud service account. This is a server-to-server, read-only integration; no user OAuth consent screen or browser token is used.

## One-time Google setup

1. Open a Google Cloud project and enable **Google Search Console API**.
2. Create a service account and a JSON key. Keep the downloaded key private.
3. In Search Console, open the exact property that matches `GOOGLE_SEARCH_CONSOLE_SITE_URL` and add the service-account email as a **Full** user (Owner also works). For a URL-prefix property, include the exact trailing slash and protocol, e.g. `https://www.example.com/`. For a Domain property, use the exact `sc-domain:example.com` property identifier.
4. Set these server-side environment variables in the deployment platform (never expose them with a `NEXT_PUBLIC_` prefix):

   - `GOOGLE_SEARCH_CONSOLE_SITE_URL`: exact Search Console property URL/identifier.
   - `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`: `client_email` from the service-account JSON.
   - `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`: `private_key` from the JSON. Preserve newlines, or store them as `\\n`; the integration converts escaped newlines.

5. Restart/redeploy the application. Sign in as an administrator and open `/admin`.
6. In **SEO Tool Autopilot**, choose **Fetch keywords from Google Search Console**. Review the imported queries, then run opportunity discovery.

## Data behavior and limits

- Uses the Search Analytics API with the `web` search type and the `query` dimension.
- Requests the most recent 28-day window ending three days before today to avoid the most recent incomplete reporting days.
- Imports up to 25,000 rows from the API; the admin UI submits at most 500 rows per discovery batch. The API orders rows by clicks unless otherwise specified.
- Metrics imported: impressions, clicks, and average position. CTR can be derived as clicks / impressions but is not currently stored in the opportunity model.
- The integration is read-only. It does not change Search Console settings, verify site ownership, submit sitemaps, or publish tools without the separate admin discovery action.
- Google may return fewer rows than total query data due to Search Analytics privacy and aggregation limits.

## Troubleshooting

- `403`: ensure the Search Console API is enabled and the service-account email has access to the exact property.
- `400`: check the property identifier and date range.
- Token errors: check that the service-account private key is complete and correctly escaped, and that the service account is active.
- Do not commit `.env`, private keys, or service-account JSON files to source control.
