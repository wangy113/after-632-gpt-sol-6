import { validateContent } from './content';
validateContent(process.argv.includes('--release'));
console.log('Content checks passed.');
