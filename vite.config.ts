import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { renderPage } from './scripts/content';
import { renderReportingExit } from './scripts/reporting';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'static-reading-page',
    transformIndexHtml(html) {
      return html.replace('<!-- reading-page -->', renderPage())
        .replace('<!-- reporting-exit -->', renderReportingExit());
    },
  }],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        exit: fileURLToPath(new URL('./exit.html', import.meta.url)),
      },
    },
  },
});
