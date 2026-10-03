import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

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
  html: {
    title: 'Passport Wizard',
  },
});
