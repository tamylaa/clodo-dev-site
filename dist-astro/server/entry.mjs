import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Db8Fy30b.mjs';
import { manifest } from './manifest_Bg8ph_t7.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/about.astro.mjs');
const _page1 = () => import('./pages/cloudflare-workers-guide.astro.mjs');
const _page2 = () => import('./pages/components.astro.mjs');
const _page3 = () => import('./pages/development-deployment-guide.astro.mjs');
const _page4 = () => import('./pages/docs.astro.mjs');
const _page5 = () => import('./pages/edge-computing-guide.astro.mjs');
const _page6 = () => import('./pages/examples.astro.mjs');
const _page7 = () => import('./pages/faq.astro.mjs');
const _page8 = () => import('./pages/migrate.astro.mjs');
const _page9 = () => import('./pages/pricing.astro.mjs');
const _page10 = () => import('./pages/privacy.astro.mjs');
const _page11 = () => import('./pages/product.astro.mjs');
const _page12 = () => import('./pages/subscribe.astro.mjs');
const _page13 = () => import('./pages/terms.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["src/pages/about.astro", _page0],
    ["src/pages/cloudflare-workers-guide.astro", _page1],
    ["src/pages/components.astro", _page2],
    ["src/pages/development-deployment-guide.astro", _page3],
    ["src/pages/docs.astro", _page4],
    ["src/pages/edge-computing-guide.astro", _page5],
    ["src/pages/examples.astro", _page6],
    ["src/pages/faq.astro", _page7],
    ["src/pages/migrate.astro", _page8],
    ["src/pages/pricing.astro", _page9],
    ["src/pages/privacy.astro", _page10],
    ["src/pages/product.astro", _page11],
    ["src/pages/subscribe.astro", _page12],
    ["src/pages/terms.astro", _page13],
    ["src/pages/index.astro", _page14]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///G:/coding/clodo-dev-site/dist-astro/client/",
    "server": "file:///G:/coding/clodo-dev-site/dist-astro/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
