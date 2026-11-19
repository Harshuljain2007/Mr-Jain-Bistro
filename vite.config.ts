import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Strips the unbuilt-source GitHub Pages redirect from compiled HTML and
      // mirrors the production bundle into /docs so GitHub Pages works whether
      // configured via GitHub Actions, branch /docs, or branch / (root).
      {
        name: 'github-pages-static-sync',
        apply: 'build',
        transformIndexHtml(html: string): string {
          return html.replace(
            /\s*<!-- GH_PAGES_UNBUILT_REDIRECT_START -->[\s\S]*?<!-- GH_PAGES_UNBUILT_REDIRECT_END -->\s*/g,
            '\n'
          );
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const docsDir = path.resolve(__dirname, 'docs');
          const distIndex = path.join(distDir, 'index.html');
          const distAssets = path.join(distDir, 'assets');
          if (!fs.existsSync(distIndex)) {
            return;
          }
          fs.rmSync(docsDir, {recursive: true, force: true});
          fs.mkdirSync(docsDir, {recursive: true});
          fs.copyFileSync(distIndex, path.join(docsDir, 'index.html'));
          if (fs.existsSync(distAssets)) {
            fs.cpSync(distAssets, path.join(docsDir, 'assets'), {
              recursive: true,
              force: true,
              filter: (src) => !src.includes(`${path.sep}aistudio`),
            });
          }
          fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
