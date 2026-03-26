/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 1 year (only effective in production behind HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content-Security-Policy — allows the app to work while blocking unwanted sources
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Inline styles needed by Tailwind/framer-motion; hashes preferred but
      // 'unsafe-inline' is acceptable for a personal finance app not handling PCI data.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Next.js uses inline scripts for hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // API calls go to the same origin; MongoDB is server-side only
      "connect-src 'self'",
      "img-src 'self' data: blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  // Reduce client bundle overhead for large icon/chart/motion imports.
  experimental: {
    optimizePackageImports: ["react-icons", "framer-motion", "recharts"],
  },
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

