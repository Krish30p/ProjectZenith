import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Enable webpack experiments required by satellite.js v7 WASM/pthread build
  experimental: {
    // Suppress the "cannot use import statement" error from satellite.js wasm workers
  },
  // Silence Turbopack error (we use a custom webpack config)
  turbopack: {},
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer, webpack }) => {
    // Copying Cesium assets is now handled by the pre-build script (copy-cesium.js)
    // This saves massive amounts of memory during the Webpack step.

    // Enable WASM + top-level await — required by satellite.js v7's wasm-build
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Suppress circular-chunk warning produced by satellite.js pthread workers
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /Circular dependency between chunks with runtime/,
      /topLevelAwait/,
    ];
    
    // Fix for node modules in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      worker_threads: false,
    };

    // Strip "node:" scheme so webpack treats them as standard modules (which are then false in fallback)
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource: any) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );

    return config;
  },
  env: {
    CESIUM_BASE_URL: '/cesium',
  },
};

export default nextConfig;
