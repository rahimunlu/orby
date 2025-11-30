/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  transpilePackages: ['@orby/types'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // WDK native bağımlılıklarını server bundle'dan çıkar
  serverExternalPackages: [
    '@tetherto/wdk',
    '@tetherto/wdk-wallet-evm',
    'sodium-native',
    'sodium-universal',
  ],

  webpack: (config, { isServer }) => {
    // Client-side için native Node.js modüllerini fallback ile kapat
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
      };
    }

    // Native modülleri webpack'ten tamamen çıkar
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'sodium-native': 'commonjs sodium-native',
        'sodium-universal': 'commonjs sodium-universal',
      });
    }

    // Dynamic require uyarılarını sustur
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },

  // Workspace root doğru tanımla (monorepo uyarısını önlemek için)
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
