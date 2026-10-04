import { fileURLToPath } from 'node:url';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const remoteSourceDir = fileURLToPath(new URL('../passport-form/src', import.meta.url));

const passportFormManifestUrl =
  process.env.PASSPORT_FORM_MANIFEST_URL ?? 'http://localhost:3001/mf-manifest.json';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'host_app',
      remotes: {
        passport_form: `passport_form@${passportFormManifestUrl}`,
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
      },
      // Fetch the remote only when PassportForm renders, so the host still starts if it is down.
      shareStrategy: 'loaded-first',
      dts: false,
      experiments: { asyncStartup: true },
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  dev: {
    // The remote's hot reload doesn't reach a page that loaded it through Module Federation,
    // so in development this page reloads whenever the remote's source changes.
    watchFiles: { paths: remoteSourceDir, type: 'reload-page' },
  },
  html: {
    title: 'Passport Wizard',
    // A minimal template only to set <html lang>; Rsbuild still injects the title, meta tags and scripts.
    template: './index.html',
  },
});
