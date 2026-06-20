import type { NextConfig } from "next";
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Workers'),
              to: '../public/cesium/Workers',
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'),
              to: '../public/cesium/ThirdParty',
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Assets'),
              to: '../public/cesium/Assets',
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'),
              to: '../public/cesium/Widgets',
            },
          ],
        })
      );
    }
    
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
