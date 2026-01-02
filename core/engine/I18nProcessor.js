import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

export class I18nProcessor {
    constructor(config) {
        this.config = config;
        this.locales = config.i18n?.locales || ['de', 'it'];
        this.baseUrl = config.site?.url || 'https://www.example.com';
        this.contentDir = 'content';
        this.publicDir = 'public';
    }

    async generate(processedFiles, distDir) {
        console.log('🌍 Generating localized pages...');

        for (const locale of this.locales) {
            await this._generateLocalePages(locale, processedFiles, distDir);
        }

        console.log('✅ Localized pages generated');
    }

    async _generateLocalePages(locale, processedFiles, distDir) {
        const localeDir = join(distDir, 'i18n', locale);
        mkdirSync(localeDir, { recursive: true });

        // Load locale data - try from content/i18n first, then fallback to defaults
        const localeData = this._loadLocaleData(locale);

        for (const [slug, meta] of Object.entries(localeData)) {
            const html = this._generateLocalizedHtml(locale, slug, meta);
            const filePath = join(localeDir, `${slug}.html`);
            writeFileSync(filePath, html);
        }
    }

    _loadLocaleData(locale) {
        // Try to load from content/i18n/<locale>.json
        const localeFile = join(this.contentDir, 'i18n', `${locale}.json`);

        if (existsSync(localeFile)) {
            try {
                const data = JSON.parse(readFileSync(localeFile, 'utf8'));
                return data;
            } catch (error) {
                console.warn(`⚠️  Failed to parse ${localeFile}, using defaults`);
            }
        }

        // Fallback: Generate basic locale data from existing pages
        return this._generateFallbackLocaleData(locale);
    }

    _generateFallbackLocaleData(locale) {
        // For now, create basic entries for key pages
        const fallbackData = {
            'clodo-framework-api-simplification': {
                title: this._getLocalizedTitle(locale, 'clodo-framework-api-simplification'),
                meta: this._getLocalizedMeta(locale, 'clodo-framework-api-simplification')
            },
            'clodo-framework-promise-to-reality': {
                title: this._getLocalizedTitle(locale, 'clodo-framework-promise-to-reality'),
                meta: this._getLocalizedMeta(locale, 'clodo-framework-promise-to-reality')
            },
            'how-to-migrate-from-wrangler': {
                title: this._getLocalizedTitle(locale, 'how-to-migrate-from-wrangler'),
                meta: this._getLocalizedMeta(locale, 'how-to-migrate-from-wrangler')
            }
        };

        return fallbackData;
    }

    _getLocalizedTitle(locale, slug) {
        const titles = {
            de: {
                'clodo-framework-api-simplification': 'API-Vereinfachung — Wie Clodo die Onboarding-Zeit um 88% reduziert hat',
                'clodo-framework-promise-to-reality': 'Vom Versprechen zur Realität — Wie wir Clodo Framework gebaut haben',
                'how-to-migrate-from-wrangler': 'Von Wrangler zu Clodo migrieren — Ein kompletter Leitfaden'
            },
            it: {
                'clodo-framework-api-simplification': 'Semplificazione API — Come Clodo ha ridotto il tempo di onboarding dell\'88%',
                'clodo-framework-promise-to-reality': 'Dalla Promessa alla Realtà — Come abbiamo costruito Clodo Framework',
                'how-to-migrate-from-wrangler': 'Migrare da Wrangler a Clodo — Una guida completa'
            }
        };

        return titles[locale]?.[slug] || `Localized: ${slug}`;
    }

    _getLocalizedMeta(locale, slug) {
        const metas = {
            de: {
                'clodo-framework-api-simplification': 'Wie wir eine komplexe API vereinfacht haben und gleichzeitig Unternehmensfunktionen beibehalten — schnellere Adoption und weniger Supportanfragen.',
                'clodo-framework-promise-to-reality': 'Die Geschichte hinter Clodo Framework — von der Idee zur Produktion, einschließlich der technischen Entscheidungen und Lektionen gelernt.',
                'how-to-migrate-from-wrangler': 'Ein Schritt-für-Schritt-Leitfaden zur Migration von Cloudflare Wrangler zu Clodo Framework mit minimaler Ausfallzeit.'
            },
            it: {
                'clodo-framework-api-simplification': 'Come abbiamo semplificato un\'API complessa mantenendo al contempo le funzionalità aziendali — adozione più rapida e meno richieste di supporto.',
                'clodo-framework-promise-to-reality': 'La storia dietro Clodo Framework — dall\'idea alla produzione, incluse le decisioni tecniche e le lezioni apprese.',
                'how-to-migrate-from-wrangler': 'Una guida passo-passo per migrare da Cloudflare Wrangler a Clodo Framework con downtime minimo.'
            }
        };

        return metas[locale]?.[slug] || `Localized description for ${slug}`;
    }

    _generateLocalizedHtml(locale, slug, meta) {
        const lang = locale.split('-')[0];
        const hreflangs = this._generateHreflangs(slug);

        return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.meta}">
  <link rel="canonical" href="${this.baseUrl}/${slug}">
  ${hreflangs}
</head>
<body>
  <div style="padding:1rem; background:#f3f4f6; border-left:4px solid #3b82f6;">
    <strong>Localized page</strong> — ${locale.toUpperCase()}
  </div>
  <main style="padding:2rem;">
    <h1>${meta.title}</h1>
    <p>${meta.meta}</p>
    <p><a href="/">← Back to home</a></p>
  </main>
</body>
</html>`;
    }

    _generateHreflangs(slug) {
        const hreflangs = [
            `<link rel="alternate" hreflang="en" href="${this.baseUrl}/${slug}">`,
            `<link rel="alternate" hreflang="x-default" href="${this.baseUrl}/${slug}">`
        ];

        for (const locale of this.locales) {
            hreflangs.push(`<link rel="alternate" hreflang="${locale}" href="${this.baseUrl}/i18n/${locale}/${slug}">`);
        }

        return hreflangs.join('\n  ');
    }
}