/** @type {import('next').NextConfig} */
const nextConfig = {
	// Reduce client bundle overhead for large icon/chart/motion imports.
	experimental: {
		optimizePackageImports: ["react-icons", "framer-motion", "recharts"],
	},
	compress: true,
	poweredByHeader: false,
};

export default nextConfig;
