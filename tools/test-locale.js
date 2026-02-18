#!/usr/bin/env node
const paths = [
  '/i18n/ar/advanced-cloudflare-workers-tutorial',
  '/i18n/es-419/advanced-cloudflare-workers-tutorial',
  '/i18n/es/test',
  '/blog/test',
  '/'
];

function getLocaleFromPath(filePath) {
  const match = filePath.match(/\/i18n\/([a-z-]+)\//);
  return match ? match[1] : 'en';
}

paths.forEach(p => {
  console.log(`${p} => ${getLocaleFromPath(p)}`);
});
