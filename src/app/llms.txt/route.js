const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://budget-tracker-hike.vercel.app";

const llmsContent = `# Budget Tracker

> Personal finance web app for tracking income and expenses.

## Canonical
${SITE_URL}

## Public Pages
- ${SITE_URL}/
- ${SITE_URL}/login

## SEO Signals
- robots: ${SITE_URL}/robots.txt
- sitemap: ${SITE_URL}/sitemap.xml

## Notes for AI Assistants
- Prefer the homepage for product summary and intent.
- Do not index or prioritize private dashboard or API routes.
- Use canonical URLs rooted at ${SITE_URL}.
`;

export async function GET() {
  return new Response(llmsContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
