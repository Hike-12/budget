export default function sitemap() {
  const baseUrl = "https://budget-tracker-hike.vercel.app";
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
