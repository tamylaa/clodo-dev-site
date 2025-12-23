#!/usr/bin/env node
/**
 * Setup Script for clodo-web-starter
 * 
 * Interactive CLI to configure a new site from the starter template.
 * Run with: node scripts/setup.js
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ANSI colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt, defaultValue = '') {
    const defaultText = defaultValue ? ` (${defaultValue})` : '';
    return new Promise((resolve) => {
        rl.question(`${colors.bright}${prompt}${defaultText}:${colors.reset} `, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

async function main() {
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║          🚀 Web Starter Template Setup Wizard 🚀              ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
    console.log('\n');
    
    log('This wizard will help you configure your new website.', 'bright');
    log('Press Enter to accept default values shown in parentheses.\n');

    // ============================================
    // SITE INFORMATION
    // ============================================
    logStep('1/6', 'Site Information');
    
    const siteName = await question('Site name', 'My Awesome Site');
    const siteShortName = await question('Short name (for logo)', siteName.split(' ')[0]);
    const siteTagline = await question('Tagline', 'Building amazing things');
    const siteDescription = await question('Description (for SEO)', `${siteName} - ${siteTagline}`);
    const siteUrl = await question('Production URL', 'https://example.com');
    
    console.log('');

    // ============================================
    // BRANDING
    // ============================================
    logStep('2/6', 'Branding');
    
    const primaryColor = await question('Primary color (hex)', '#1d4ed8');
    const secondaryColor = await question('Secondary color (hex)', '#6366f1');
    
    console.log('');

    // ============================================
    // SOCIAL LINKS
    // ============================================
    logStep('3/6', 'Social Links (leave blank to skip)');
    
    const githubUrl = await question('GitHub URL', '');
    const twitterUrl = await question('Twitter/X URL', '');
    const linkedinUrl = await question('LinkedIn URL', '');
    
    console.log('');

    // ============================================
    // CONTACT
    // ============================================
    logStep('4/6', 'Contact Information');
    
    const contactEmail = await question('Contact email', `contact@${new URL(siteUrl).hostname.replace('www.', '')}`);
    const supportEmail = await question('Support email', contactEmail);
    
    console.log('');

    // ============================================
    // ORGANIZATION
    // ============================================
    logStep('5/6', 'Organization (for schema.org)');
    
    const orgName = await question('Organization/Company name', siteName);
    const copyrightHolder = await question('Copyright holder', orgName);
    const foundingYear = await question('Founding year', new Date().getFullYear().toString());
    
    console.log('');

    // ============================================
    // CLOUDFLARE
    // ============================================
    logStep('6/6', 'Cloudflare Pages');
    
    const cfProjectName = await question('Cloudflare project name', siteName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    
    console.log('\n');

    // ============================================
    // GENERATE CONFIG
    // ============================================
    log('Generating configuration...', 'bright');
    
    const configContent = `/**
 * Site Configuration
 * Generated by setup wizard on ${new Date().toISOString().split('T')[0]}
 * 
 * Edit this file to customize your site's metadata, branding, and settings.
 * All values here are used throughout the build process and templates.
 */

const siteConfig = {
  // ============================================
  // SITE IDENTITY
  // ============================================
  site: {
    name: '${siteName}',
    shortName: '${siteShortName}',
    tagline: '${siteTagline}',
    description: '${siteDescription}',
    url: '${siteUrl}',
    language: 'en',
    locale: 'en_US',
    
    // Copyright information
    copyright: {
      holder: '${copyrightHolder}',
      year: ${new Date().getFullYear()},
      startYear: ${foundingYear}
    }
  },

  // ============================================
  // BRANDING & VISUAL IDENTITY
  // ============================================
  branding: {
    logo: {
      path: '/logo.svg',
      alt: '${siteName} Logo',
      width: 512,
      height: 512
    },
    favicon: {
      path: '/favicon.ico',
      appleTouchIcon: '/apple-touch-icon.png'
    },
    colors: {
      primary: '${primaryColor}',
      secondary: '${secondaryColor}',
      themeColor: '${primaryColor}'
    }
  },

  // ============================================
  // SOCIAL MEDIA LINKS
  // ============================================
  social: {
    twitter: {
      url: '${twitterUrl}',
      handle: '${twitterUrl ? '@' + twitterUrl.split('/').pop() : ''}'
    },
    github: {
      url: '${githubUrl}',
      org: '${githubUrl ? githubUrl.split('/').slice(-2, -1)[0] || '' : ''}',
      repo: '${githubUrl ? githubUrl.split('/').pop() || '' : ''}'
    },
    linkedin: {
      url: '${linkedinUrl}'
    },
    discord: {
      url: ''
    }
  },

  // ============================================
  // CONTACT INFORMATION
  // ============================================
  contact: {
    email: {
      general: '${contactEmail}',
      support: '${supportEmail}',
      sales: '${contactEmail}',
      product: '${contactEmail}'
    },
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: ''
    }
  },

  // ============================================
  // SCHEMA.ORG STRUCTURED DATA
  // ============================================
  schema: {
    organization: {
      type: 'Organization',
      name: '${orgName}',
      legalName: '${orgName}',
      foundingDate: '${foundingYear}',
      description: '${siteDescription}',
      sameAs: []
    },
    website: {
      type: 'WebSite',
      potentialAction: {
        type: 'SearchAction',
        target: '${siteUrl}/search?q={search_term_string}',
        queryInput: 'required name=search_term_string'
      }
    }
  },

  // ============================================
  // ANALYTICS & THIRD-PARTY SERVICES
  // ============================================
  services: {
    analytics: {
      cloudflare: { enabled: true },
      google: { enabled: false, measurementId: '' }
    },
    newsletter: {
      provider: 'brevo'
    },
    chat: {
      enabled: false,
      provider: null
    },
    verification: {
      google: '',
      bing: ''
    }
  },

  // ============================================
  // CLOUDFLARE PAGES CONFIGURATION
  // ============================================
  cloudflare: {
    projectName: '${cfProjectName}',
    accountId: ''
  },

  // ============================================
  // BUILD OPTIONS
  // ============================================
  build: {
    outputDir: 'dist',
    publicDir: 'public',
    optimization: {
      criticalCss: true,
      contentHashing: true,
      minifyHtml: true,
      minifyCss: true,
      minifyJs: true,
      generateSitemap: true,
      generateRobots: true
    }
  },

  // ============================================
  // CONTENT CONFIGURATION
  // ============================================
  content: {
    blog: {
      enabled: true,
      postsPerPage: 10,
      path: '/blog',
      categories: ['Tutorial', 'News', 'Case Study', 'Technical', 'General']
    },
    defaultAuthor: {
      name: '${copyrightHolder}',
      email: '${contactEmail}',
      url: '${siteUrl}/about'
    }
  }
};

// Auto-populate schema.org sameAs from social links
const socialUrls = Object.values(siteConfig.social || {})
  .filter(s => s?.url)
  .map(s => s.url);
  
if (siteConfig.schema?.organization) {
  siteConfig.schema.organization.sameAs = socialUrls;
}

export default siteConfig;
`;

    // Write config file
    const configPath = join(ROOT_DIR, 'config', 'site.config.js');
    writeFileSync(configPath, configContent, 'utf8');
    logSuccess('Created config/site.config.js');

    // ============================================
    // CREATE .env FILE
    // ============================================
    const envExamplePath = join(ROOT_DIR, '.env.example');
    const envPath = join(ROOT_DIR, '.env');
    
    if (existsSync(envExamplePath) && !existsSync(envPath)) {
        copyFileSync(envExamplePath, envPath);
        logSuccess('Created .env from .env.example');
        logWarning('Remember to fill in your API keys in .env');
    }

    // ============================================
    // UPDATE package.json NAME
    // ============================================
    const packagePath = join(ROOT_DIR, 'package.json');
    if (existsSync(packagePath)) {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        pkg.name = cfProjectName;
        pkg.description = siteDescription;
        writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
        logSuccess('Updated package.json');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════════╗', 'green');
    log('║                    ✅ Setup Complete!                         ║', 'green');
    log('╚══════════════════════════════════════════════════════════════╝', 'green');
    console.log('\n');
    
    log('Next steps:', 'bright');
    console.log('');
    console.log('  1. Review and customize config/site.config.js');
    console.log('  2. Add your logo to public/logo.svg');
    console.log('  3. Update .env with your API keys');
    console.log('  4. Run the development server:');
    console.log('');
    log('     npm run dev', 'cyan');
    console.log('');
    console.log('  5. Build for production:');
    console.log('');
    log('     npm run build', 'cyan');
    console.log('');
    
    log('Happy building! 🚀', 'green');
    console.log('\n');

    rl.close();
}

// Run the setup wizard
main().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
});
