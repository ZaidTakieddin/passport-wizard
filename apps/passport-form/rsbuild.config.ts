import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Only the host app may fetch this remote's manifest cross-origin.
const hostOrigin = process.env.HOST_APP_ORIGIN ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'passport_form',
      filename: 'remoteEntry.js',
      exposes: {
        './PassportForm': './src/PassportForm/PassportForm.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
      },
      dts: false,
      experiments: { asyncStartup: true },
    }),
  ],
  server: {
    port: 3001,
    // Fail instead of silently moving to another port: the host will load this app from 3001.
    strictPort: true,
    cors: { origin: hostOrigin },
  },
  output: {
    // Resolve chunk URLs from wherever remoteEntry.js was loaded, so a host on another
    // origin requests them from this app instead of from itself.
    assetPrefix: 'auto',
  },
  html: {
    title: 'Passport Form',
  },
});
