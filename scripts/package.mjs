import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
const { version } = JSON.parse(readFileSync('package.json'));
mkdirSync('dist', { recursive: true });
const files = readdirSync('.').filter(name => name.endsWith('.hbs') || name === 'package.json');
const target = `dist/cpj-theme-${version}.zip`;
rmSync(target, { force: true });
execFileSync('zip', ['-qr', target, ...files, 'assets', 'partials', '-x', '*.DS_Store']);
console.log(target);
