export default function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://budget-tracker-hike.vercel.app";
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
