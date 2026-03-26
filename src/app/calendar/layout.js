export const metadata = {
  title: "Calendar",
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
    canonical: "/calendar",
  },
};

export default function CalendarLayout({ children }) {
  return children;
}
