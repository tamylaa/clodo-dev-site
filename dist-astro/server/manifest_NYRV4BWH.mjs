import 'piccolore';
import { h as decodeKey } from './chunks/astro/server_xkN4raX_.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BEKKGp12.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///G:/coding/clodo-dev-site/","cacheDir":"file:///G:/coding/clodo-dev-site/node_modules/.astro/","outDir":"file:///G:/coding/clodo-dev-site/dist-astro/","srcDir":"file:///G:/coding/clodo-dev-site/src/","publicDir":"file:///G:/coding/clodo-dev-site/public/","buildClientDir":"file:///G:/coding/clodo-dev-site/dist-astro/client/","buildServerDir":"file:///G:/coding/clodo-dev-site/dist-astro/server/","adapterName":"@astrojs/node","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"about/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"cloudflare-workers-guide/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/cloudflare-workers-guide","isIndex":false,"type":"page","pattern":"^\\/cloudflare-workers-guide\\/?$","segments":[[{"content":"cloudflare-workers-guide","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/cloudflare-workers-guide.astro","pathname":"/cloudflare-workers-guide","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"components/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/components","isIndex":false,"type":"page","pattern":"^\\/components\\/?$","segments":[[{"content":"components","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/components.astro","pathname":"/components","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"development-deployment-guide/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/development-deployment-guide","isIndex":false,"type":"page","pattern":"^\\/development-deployment-guide\\/?$","segments":[[{"content":"development-deployment-guide","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/development-deployment-guide.astro","pathname":"/development-deployment-guide","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"docs/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/docs","isIndex":false,"type":"page","pattern":"^\\/docs\\/?$","segments":[[{"content":"docs","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/docs.astro","pathname":"/docs","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"edge-computing-guide/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/edge-computing-guide","isIndex":false,"type":"page","pattern":"^\\/edge-computing-guide\\/?$","segments":[[{"content":"edge-computing-guide","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/edge-computing-guide.astro","pathname":"/edge-computing-guide","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"examples/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/examples","isIndex":false,"type":"page","pattern":"^\\/examples\\/?$","segments":[[{"content":"examples","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/examples.astro","pathname":"/examples","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"faq/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/faq","isIndex":false,"type":"page","pattern":"^\\/faq\\/?$","segments":[[{"content":"faq","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/faq.astro","pathname":"/faq","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"migrate/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/migrate","isIndex":false,"type":"page","pattern":"^\\/migrate\\/?$","segments":[[{"content":"migrate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/migrate.astro","pathname":"/migrate","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"pricing/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/pricing","isIndex":false,"type":"page","pattern":"^\\/pricing\\/?$","segments":[[{"content":"pricing","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/pricing.astro","pathname":"/pricing","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"product/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/product","isIndex":false,"type":"page","pattern":"^\\/product\\/?$","segments":[[{"content":"product","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/product.astro","pathname":"/product","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://clodo.dev","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["G:/coding/clodo-dev-site/src/pages/about.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/cloudflare-workers-guide.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/components.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/development-deployment-guide.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/docs.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/edge-computing-guide.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/examples.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/faq.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/index.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/migrate.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/pricing.astro",{"propagation":"none","containsHead":true}],["G:/coding/clodo-dev-site/src/pages/product.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/cloudflare-workers-guide@_@astro":"pages/cloudflare-workers-guide.astro.mjs","\u0000@astro-page:src/pages/components@_@astro":"pages/components.astro.mjs","\u0000@astro-page:src/pages/development-deployment-guide@_@astro":"pages/development-deployment-guide.astro.mjs","\u0000@astro-page:src/pages/docs@_@astro":"pages/docs.astro.mjs","\u0000@astro-page:src/pages/edge-computing-guide@_@astro":"pages/edge-computing-guide.astro.mjs","\u0000@astro-page:src/pages/examples@_@astro":"pages/examples.astro.mjs","\u0000@astro-page:src/pages/faq@_@astro":"pages/faq.astro.mjs","\u0000@astro-page:src/pages/migrate@_@astro":"pages/migrate.astro.mjs","\u0000@astro-page:src/pages/pricing@_@astro":"pages/pricing.astro.mjs","\u0000@astro-page:src/pages/product@_@astro":"pages/product.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_NYRV4BWH.mjs","G:/coding/clodo-dev-site/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","G:/coding/clodo-dev-site/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_0_lang.Cven_nVW.js","G:/coding/clodo-dev-site/src/components/Header.astro?astro&type=script&index=0&lang.ts":"_astro/Header.astro_astro_type_script_index_0_lang.D3QhGwOA.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["G:/coding/clodo-dev-site/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts","!function(){try{const t=\"dark\"===localStorage.getItem(\"clodo-theme\")?\"dark\":\"light\";document.documentElement.setAttribute(\"data-theme\",t),document.documentElement.style.colorScheme=t}catch(t){document.documentElement.setAttribute(\"data-theme\",\"light\"),document.documentElement.style.colorScheme=\"light\"}}();"],["G:/coding/clodo-dev-site/src/components/Header.astro?astro&type=script&index=0&lang.ts","const e=document.getElementById(\"mobile-menu-toggle\"),t=document.getElementById(\"mobile-menu\");e&&t&&(e.addEventListener(\"click\",()=>{const n=\"true\"===e.getAttribute(\"aria-expanded\");e.setAttribute(\"aria-expanded\",(!n).toString()),t.setAttribute(\"data-visible\",(!n).toString())}),t.querySelectorAll(\".nav-link:not(.nav-dropdown-toggle)\").forEach(n=>{n.addEventListener(\"click\",()=>{e.setAttribute(\"aria-expanded\",\"false\"),t.setAttribute(\"data-visible\",\"false\")})})),document.querySelectorAll(\".nav-dropdown-toggle\").forEach(e=>{e.addEventListener(\"click\",t=>{if(window.innerWidth<=768){t.preventDefault();const n=\"true\"===e.getAttribute(\"aria-expanded\");e.setAttribute(\"aria-expanded\",(!n).toString())}})});"]],"assets":["/_astro/about.CQ--PcmH.css","/_astro/about.WJ4jva88.css","/_astro/cloudflare-workers-guide.DccGic-b.css","/_astro/components.COjnCmBX.css","/_astro/development-deployment-guide.BiYBPr9H.css","/_astro/docs.rLKp3div.css","/_astro/edge-computing-guide.CzJ0wMNu.css","/_astro/examples.CI2OQ7ml.css","/_astro/faq.CSb_JNV2.css","/about.html","/analytics.html","/clodo-framework-api-simplification.html","/clodo-framework-guide.html","/clodo-framework-promise-to-reality.html","/clodo-vs-lambda.html","/cloudflare-workers-guide.html","/components.html","/development-deployment-guide.html","/docs.html","/edge-computing-guide.html","/edge-vs-cloud-computing.html","/examples.html","/faq.html","/favicon.svg","/google1234567890abcdef.html","/how-to-migrate-from-wrangler.html","/index.html","/migrate.html","/performance-dashboard.html","/pricing.html","/privacy.html","/product.html","/robots.txt","/script.js","/site.webmanifest","/sitemap.xml","/structured-data.html","/styles.css","/subscribe.html","/test-modules.html","/what-is-cloudflare-workers.html","/what-is-edge-computing.html","/workers-vs-lambda.html","/_headers","/_redirects","/blog/building-developer-communities.html","/blog/cloudflare-infrastructure-myth.html","/blog/cloudflare-workers-tutorial-beginners.html","/blog/debugging-silent-build-failures.html","/blog/index.html","/blog/instant-try-it-impact.html","/blog/stackblitz-integration-journey.html","/case-studies/fintech-payment-platform.html","/case-studies/healthcare-saas-platform.html","/case-studies/index.html","/community/welcome.html","/css/base.css","/css/components-common-backup.css","/css/components-common.css","/css/components-deferred.css","/css/components-full-backup.css","/css/components-page-specific.css","/css/components-reusable.css","/css/components.css","/css/critical-base.css","/css/hero-decorations.css","/css/layout.css","/css/utilities.css","/demo/demo.js","/demo/index.html","/demo/modal.js","/icons/bar-chart.svg","/icons/book.svg","/icons/building.svg","/icons/celebration.svg","/icons/check-circle.svg","/icons/check.svg","/icons/clipboard.svg","/icons/clock.svg","/icons/cloud.svg","/icons/code.svg","/icons/computer.svg","/icons/construction.svg","/icons/database.svg","/icons/dollar.svg","/icons/enterprise.svg","/icons/globe.svg","/icons/grid.svg","/icons/icon.svg","/icons/lightbulb.svg","/icons/lightning.svg","/icons/lock.svg","/icons/monitor.svg","/icons/play.svg","/icons/refresh.svg","/icons/robot.svg","/icons/rocket.svg","/icons/runner.svg","/icons/smartphone.svg","/icons/target.svg","/icons/tools.svg","/icons/trending-up.svg","/icons/wrench.svg","/js/analytics.js","/js/component-nav.js","/js/defer-css.js","/js/github-integration.js","/js/init-systems.js","/js/lazy-loading.js","/js/main.js","/js/MODULE_STRUCTURE.md","/js/README.md","/js/scroll-animations.js","/css/components/buttons.css","/css/global/footer.css","/css/global/header.css","/css/pages/about.css","/css/pages/blog.css","/css/pages/blog.css.backup","/css/pages/case-studies.css","/css/pages/community.css","/css/pages/index.css","/css/pages/index.css.backup","/css/pages/migrate.css","/css/pages/pricing.css","/css/pages/pricing.css.backup","/css/pages/product.css","/css/pages/subscribe-enhanced.css.backup","/css/pages/subscribe.css","/js/config/features.js","/js/config/README.md","/js/core/accessibility.js","/js/core/app.js","/js/core/component.js","/js/core/event-bus.js","/js/core/index.js","/js/core/navigation.js","/js/core/performance-monitor.js","/js/core/seo.js","/js/core/storage.js","/js/core/theme.js","/js/examples/component-examples.js","/js/features/brevo-chat.js","/js/features/forms.js","/js/features/icon-system.js","/js/features/index.js","/js/features/newsletter.js","/js/ui/index.js","/js/ui/modal.js","/js/ui/navigation-component.js","/js/ui/tabs.js","/js/ui/tooltip.js","/css/pages/blog/card.css","/css/pages/blog/header.css","/css/pages/blog/index.css","/css/pages/blog/post.css","/css/pages/blog/stats.css","/css/pages/index/benefits.css","/css/pages/index/cloudflare-edge.css","/css/pages/index/comparison.css","/css/pages/index/cta.css","/css/pages/index/features.css","/css/pages/index/hero-animations.css","/css/pages/index/hero-backup.css","/css/pages/index/hero.css","/css/pages/index/social-proof.css","/css/pages/index/stats.css","/css/pages/index/testimonials.css","/css/pages/pricing/cards.css","/css/pages/pricing/contact-form.css","/css/pages/pricing/hero.css","/css/pages/subscribe/form.css","/css/pages/subscribe/hero.css","/css/pages/subscribe/preview.css","/css/pages/subscribe/testimonials.css","/about/index.html","/cloudflare-workers-guide/index.html","/components/index.html","/development-deployment-guide/index.html","/docs/index.html","/edge-computing-guide/index.html","/examples/index.html","/faq/index.html","/migrate/index.html","/pricing/index.html","/product/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"6fXltf4X42Iz1nA3WSn7ViY+taT6ePhJAmaHzF97H3o=","sessionConfig":{"driver":"fs-lite","options":{"base":"G:\\coding\\clodo-dev-site\\node_modules\\.astro\\sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
