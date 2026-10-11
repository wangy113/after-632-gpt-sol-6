import { defineConfig } from 'vite';
import { renderPage, validateContent } from './scripts/content.ts';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'static-history',
    buildStart() {
      validateContent();
      mkdirSync('public/assets/fonts', { recursive: true });
      for (const font of ['bebas-neue', 'abril-fatface', 'dm-sans']) {
        copyFileSync(`node_modules/@fontsource/${font}/LICENSE`, `public/assets/fonts/${font}-LICENSE.txt`);
      }
      copyFileSync('node_modules/three/LICENSE', 'public/assets/three-LICENSE.txt');
    },
    transformIndexHtml(html) { return html.replace('<!--experience-->', renderPage()); },
  }],
  build: { target: 'es2022' },
});
