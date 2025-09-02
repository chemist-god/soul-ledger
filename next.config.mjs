/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid incorrect workspace root inference when multiple lockfiles exist
  outputFileTracingRoot: process.cwd(),
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
