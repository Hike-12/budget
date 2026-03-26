export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default function DashboardLayout({ children }) {
  return children;
}
