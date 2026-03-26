import "./globals.css";
import Navbar from "@/components/Navbar";
import Dock from "@/components/Dock";
import { Toaster } from "@/components/sonner";
import QueryProvider from "@/components/QueryProvider";
import { Figtree, Plus_Jakarta_Sans } from "next/font/google";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://budget-tracker-hike.vercel.app"),
  title: {
    default: "Budget Tracker | Smart Personal Finance Tracking",
    template: "%s | Budget Tracker",
  },
  description:
    "Track expenses and income with a fast, modern budget tracker designed for clarity, control, and smarter personal finance decisions.",
  applicationName: "Budget Tracker",
  keywords: [
    "budget tracker",
    "expense tracker",
    "personal finance app",
    "money management",
    "income and expense tracking",
    "financial planning",
    "budget planner",
  ],
  authors: [{ name: "Budget Tracker" }],
  creator: "Budget Tracker",
  publisher: "Budget Tracker",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Budget Tracker",
    title: "Budget Tracker | Smart Personal Finance Tracking",
    description:
      "Track expenses and income with a fast, modern budget tracker designed for clarity, control, and smarter personal finance decisions.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Budget Tracker logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget Tracker | Smart Personal Finance Tracking",
    description:
      "Track expenses and income with a fast, modern budget tracker designed for clarity, control, and smarter personal finance decisions.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "jG7YdOZ6p0WKMqwpAo-zIen_sTDVyGIcb46vHhpp_8w",
  },
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`relative min-h-screen w-full overflow-x-hidden text-(--color-accent) bg-dark ${figtree.variable} ${plusJakartaSans.variable}`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Dashed Bottom Fade Grid */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in srgb, var(--color-accent) 15%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in srgb, var(--color-accent) 15%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 0",
            maskImage: `
               repeating-linear-gradient(
                    to right,
                    black 0px,
                    black 3px,
                    transparent 3px,
                    transparent 8px
                  ),
                  repeating-linear-gradient(
                    to bottom,
                    black 0px,
                    black 3px,
                    transparent 3px,
                    transparent 8px
                  ),
                  radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
            `,
            WebkitMaskImage: `
            repeating-linear-gradient(
                    to right,
                    black 0px,
                    black 3px,
                    transparent 3px,
                    transparent 8px
                  ),
                  repeating-linear-gradient(
                    to bottom,
                    black 0px,
                    black 3px,
                    transparent 3px,
                    transparent 8px
                  ),
                  radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
            `,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        <Navbar />
        <Dock />
        <QueryProvider>
          <main id="main-content" tabIndex={-1} className="relative z-10">
            {children}
          </main>
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
