import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const verificationToken = (
    env.VITE_GOOGLE_SITE_VERIFICATION ||
    process.env.VITE_GOOGLE_SITE_VERIFICATION ||
    ''
  ).trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-google-site-verification',
        transformIndexHtml(html) {
          if (verificationToken) {
            return html.replace(
              '<!-- GOOGLE_SITE_VERIFICATION -->',
              `<meta name="google-site-verification" content="${verificationToken}" />`,
            );
          }
          return html.replace(/\s*<!-- GOOGLE_SITE_VERIFICATION -->/g, '');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
