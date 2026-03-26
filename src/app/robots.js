export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/calendar", "/login"],
      },
    ],
    sitemap: "https://budget-tracker-hike.vercel.app/sitemap.xml",
    host: "https://budget-tracker-hike.vercel.app",
  };
}
