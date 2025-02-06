/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    const experiments = config.experiments || {}
    config.experiments = { ...experiments, asyncWebAssembly: true }
    config.output.assetModuleFilename = 'static/[hash][ext]'
    config.output.publicPath = '/_next/'
    config.module.rules.push({
      test: /\.wasm/,
      type: 'asset/resource'
    })
    return config
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
