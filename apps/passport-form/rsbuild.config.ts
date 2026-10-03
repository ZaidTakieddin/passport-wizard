import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3001,
    // Fail instead of silently moving to another port: the host will load this app from 3001.
    strictPort: true,
  },
  html: {
    title: 'Passport Form',
  },
});
