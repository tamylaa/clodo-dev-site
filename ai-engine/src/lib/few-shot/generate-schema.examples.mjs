/**
 * Few-Shot Examples — Schema Markup Generation
 *
 * Demonstrates the expected LLM enhancement output: given a list of
 * placeholder strings found in deterministic JSON-LD, return replacement
 * text derived from the page's bodyPreview.
 */

export const GENERATE_SCHEMA_FEW_SHOT = [
  {
    input: {
      placeholders: [
        '[Write 2-3 sentences answering: "What is schema markup?"]',
        '[Write 2-3 sentences answering: "Why does schema markup matter for SEO?"]'
      ],
      bodyPreview: 'Schema markup is a type of structured data vocabulary that helps search engines better understand the content on your website. By adding schema markup to your HTML, you provide explicit clues about the meaning of your page. This can lead to rich snippets in search results, which improve visibility and click-through rates. Schema markup matters for SEO because it helps Google display enhanced results — FAQs, star ratings, breadcrumbs, and how-to steps — directly in the SERP. Pages with rich results typically see 20-30% higher CTR than standard blue links.'
    },
    output: {
      enhancements: [
        {
          placeholder: '[Write 2-3 sentences answering: "What is schema markup?"]',
          replacement: 'Schema markup is a type of structured data vocabulary that helps search engines better understand the content on your website. By adding schema markup to your HTML, you provide explicit clues about the meaning of your page, which can lead to rich snippets in search results.'
        },
        {
          placeholder: '[Write 2-3 sentences answering: "Why does schema markup matter for SEO?"]',
          replacement: 'Schema markup matters for SEO because it helps Google display enhanced results — FAQs, star ratings, breadcrumbs, and how-to steps — directly in the SERP. Pages with rich results typically see 20-30% higher CTR than standard blue links.'
        }
      ]
    }
  },
  {
    input: {
      placeholders: [
        '[Describe step 1: Install the Plugin]',
        '[Describe step 2: Configure Settings]',
        '[Describe step 3: Validate with Google]'
      ],
      bodyPreview: 'To get started, install the Yoast SEO plugin from the WordPress plugin directory. Once activated, navigate to SEO > General > Features and enable the "Schema" toggle. Next, configure your site-wide settings including organization name, logo URL, and default schema type under SEO > Search Appearance. Finally, validate your schema by pasting your URL into Google\'s Rich Results Test at search.google.com/test/rich-results. Fix any errors flagged, then request re-indexing via Google Search Console.'
    },
    output: {
      enhancements: [
        {
          placeholder: '[Describe step 1: Install the Plugin]',
          replacement: 'Install the Yoast SEO plugin from the WordPress plugin directory. Once activated, navigate to SEO > General > Features and enable the "Schema" toggle.'
        },
        {
          placeholder: '[Describe step 2: Configure Settings]',
          replacement: 'Configure your site-wide settings including organization name, logo URL, and default schema type under SEO > Search Appearance.'
        },
        {
          placeholder: '[Describe step 3: Validate with Google]',
          replacement: 'Validate your schema by pasting your URL into Google\'s Rich Results Test at search.google.com/test/rich-results. Fix any errors flagged, then request re-indexing via Google Search Console.'
        }
      ]
    }
  }
];

export function formatGenerateSchemaExamples(maxExamples = 2) {
  const selected = GENERATE_SCHEMA_FEW_SHOT.slice(0, maxExamples);
  return `Here are examples of how to fill placeholder text using the page content:\n\n${JSON.stringify(selected, null, 2)}\n\nNow fill the following placeholders using the provided page content.`;
}
