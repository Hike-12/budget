export const metadata = {
  title: "Login",
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
    canonical: "/login",
  },
};

export default function LoginLayout({ children }) {
  return children;
}
