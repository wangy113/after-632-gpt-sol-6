import { validateContent } from './content';
import assets from '../content/assets.json' with { type: 'json' };
import { statSync } from 'node:fs';

validateContent(process.argv.includes('--release'));
for (const asset of assets) {
  const paths = 'paths' in asset ? asset.paths ?? [] : 'path' in asset && asset.path?.startsWith('public/') ? [asset.path] : [];
  const bytes = paths.reduce((total, path) => total + statSync(path).size, 0);
  if ('sizeBytes' in asset && bytes !== asset.sizeBytes) throw new Error(`${asset.id}: expected ${asset.sizeBytes} bytes, found ${bytes}`);
}
console.log('Content checks passed.');
