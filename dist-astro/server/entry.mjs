import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_qBpROvXh.mjs';
import { manifest } from './manifest_D6wafXsO.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/about.astro.mjs');
const _page1 = () => import('./pages/analytics.astro.mjs');
const _page2 = () => import('./pages/blog/cloudflare-infrastructure-myth.astro.mjs');
const _page3 = () => import('./pages/blog/cloudflare-workers-tutorial-beginners.astro.mjs');
const _page4 = () => import('./pages/blog.astro.mjs');
const _page5 = () => import('./pages/clodo-framework-api-simplification.astro.mjs');
const _page6 = () => import('./pages/clodo-framework-guide.astro.mjs');
const _page7 = () => import('./pages/clodo-framework-promise-to-reality.astro.mjs');
const _page8 = () => import('./pages/clodo-vs-lambda.astro.mjs');
const _page9 = () => import('./pages/cloudflare-workers-guide.astro.mjs');
const _page10 = () => import('./pages/components.astro.mjs');
const _page11 = () => import('./pages/development-deployment-guide.astro.mjs');
const _page12 = () => import('./pages/docs.astro.mjs');
const _page13 = () => import('./pages/edge-computing-guide.astro.mjs');
const _page14 = () => import('./pages/edge-vs-cloud-computing.astro.mjs');
const _page15 = () => import('./pages/examples.astro.mjs');
const _page16 = () => import('./pages/faq.astro.mjs');
const _page17 = () => import('./pages/how-to-migrate-from-wrangler.astro.mjs');
const _page18 = () => import('./pages/migrate.astro.mjs');
const _page19 = () => import('./pages/performance-dashboard.astro.mjs');
const _page20 = () => import('./pages/pricing.astro.mjs');
const _page21 = () => import('./pages/privacy.astro.mjs');
const _page22 = () => import('./pages/product.astro.mjs');
const _page23 = () => import('./pages/structured-data.astro.mjs');
const _page24 = () => import('./pages/subscribe.astro.mjs');
const _page25 = () => import('./pages/terms.astro.mjs');
const _page26 = () => import('./pages/test-modules.astro.mjs');
const _page27 = () => import('./pages/what-is-cloudflare-workers.astro.mjs');
const _page28 = () => import('./pages/what-is-edge-computing.astro.mjs');
const _page29 = () => import('./pages/workers-vs-lambda.astro.mjs');
const _page30 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["src/pages/about.astro", _page0],
    ["src/pages/analytics.astro", _page1],
    ["src/pages/blog/cloudflare-infrastructure-myth.astro", _page2],
    ["src/pages/blog/cloudflare-workers-tutorial-beginners.astro", _page3],
    ["src/pages/blog/index.astro", _page4],
    ["src/pages/clodo-framework-api-simplification.astro", _page5],
    ["src/pages/clodo-framework-guide.astro", _page6],
    ["src/pages/clodo-framework-promise-to-reality.astro", _page7],
    ["src/pages/clodo-vs-lambda.astro", _page8],
    ["src/pages/cloudflare-workers-guide.astro", _page9],
    ["src/pages/components.astro", _page10],
    ["src/pages/development-deployment-guide.astro", _page11],
    ["src/pages/docs.astro", _page12],
    ["src/pages/edge-computing-guide.astro", _page13],
    ["src/pages/edge-vs-cloud-computing.astro", _page14],
    ["src/pages/examples.astro", _page15],
    ["src/pages/faq.astro", _page16],
    ["src/pages/how-to-migrate-from-wrangler.astro", _page17],
    ["src/pages/migrate.astro", _page18],
    ["src/pages/performance-dashboard.astro", _page19],
    ["src/pages/pricing.astro", _page20],
    ["src/pages/privacy.astro", _page21],
    ["src/pages/product.astro", _page22],
    ["src/pages/structured-data.astro", _page23],
    ["src/pages/subscribe.astro", _page24],
    ["src/pages/terms.astro", _page25],
    ["src/pages/test-modules.astro", _page26],
    ["src/pages/what-is-cloudflare-workers.astro", _page27],
    ["src/pages/what-is-edge-computing.astro", _page28],
    ["src/pages/workers-vs-lambda.astro", _page29],
    ["src/pages/index.astro", _page30]
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
