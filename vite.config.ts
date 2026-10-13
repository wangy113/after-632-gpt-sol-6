import { defineConfig } from 'vite';
import { renderPage } from './scripts/content';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'static-reading-page',
    transformIndexHtml(html) {
      return html.replace('<!-- reading-page -->', renderPage());
    },
  }],
  build: { target: 'es2022' },
});
