import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/sonner";

export const metadata = {
  title: "Budget Tracker",
  description: "Minimal, modern budget tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="relative min-h-screen w-full overflow-x-hidden text-[var(--color-accent)] bg-dark">
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
        <main className="relative z-10">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}