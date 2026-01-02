/**
 * Path Manager
 * Provides centralized path management for the Clodo Framework
 */

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PathManager {
  constructor(config) {
    this._config = config;
    this.rootDir = process.cwd();
    this.initializePaths();
  }

  /**
   * Initialize all path mappings
   */
  initializePaths() {
    // Core directories
    this.paths = {
      // Root and source
      root: this.rootDir,
      src: join(this.rootDir, this._config.get('build.sourceDir', 'src')),
      public: join(this.rootDir, this._config.get('build.publicDir', 'public')),
      dist: join(this.rootDir, this._config.get('build.outputDir', 'dist')),
      templates: join(this.rootDir, this._config.get('build.templatesDir', 'templates')),
      content: join(this.rootDir, this._config.get('build.contentDir', 'content')),
      data: join(this.rootDir, this._config.get('build.dataDir', 'data')),
      assets: join(this.rootDir, this._config.get('build.assetsDir', 'assets')),

      // Build and tools
      build: join(this.rootDir, 'build'),
      config: join(this.rootDir, 'config'),
      tools: join(this.rootDir, 'tools'),
      scripts: join(this.rootDir, 'scripts'),
      lib: join(this.rootDir, 'lib'),
      tests: join(this.rootDir, 'tests'),

      // Special content paths
      blogData: join(this.rootDir, this._config.get('build.dataDir', 'data'), 'blog-data.json'),
      posts: join(this.rootDir, this._config.get('build.contentDir', 'content'), 'blog', 'posts'),

      // Configuration files
      clodoConfig: join(this.rootDir, 'clodo.config.js'),
      packageJson: join(this.rootDir, 'package.json'),
      wranglerToml: join(this.rootDir, 'config', 'wrangler.toml'),
      viteConfig: join(this.rootDir, 'config', 'vite.config.js'),
      playwrightConfig: join(this.rootDir, 'config', 'playwright.config.js'),

      // Output paths
      criticalCss: join(this.rootDir, this._config.get('build.outputDir', 'dist'), 'critical.css'),
      sitemap: join(this.rootDir, this._config.get('build.outputDir', 'dist'), 'sitemap.xml'),
      robots: join(this.rootDir, this._config.get('build.outputDir', 'dist'), 'robots.txt')
    };
  }

  // ============================================
  // CORE PATHS
  // ============================================

  /**
   * Get root directory
   */
  get root() {
    return this.paths.root;
  }

  /**
   * Get source directory
   */
  get src() {
    return this.paths.src;
  }

  /**
   * Get public directory
   */
  get public() {
    return this.paths.public;
  }

  /**
   * Get distribution/output directory
   */
  get dist() {
    return this.paths.dist;
  }

  /**
   * Get templates directory
   */
  get templates() {
    return this.paths.templates;
  }

  /**
   * Get content directory
   */
  get content() {
    return this.paths.content;
  }

  /**
   * Get data directory
   */
  get data() {
    return this.paths.data;
  }

  /**
   * Get assets directory
   */
  get assets() {
    return this.paths.assets;
  }

  // ============================================
  // BUILD & TOOLS PATHS
  // ============================================

  /**
   * Get build directory
   */
  get build() {
    return this.paths.build;
  }

  /**
   * Get config directory
   */
  get config() {
    return this.paths.config;
  }

  /**
   * Get tools directory
   */
  get tools() {
    return this.paths.tools;
  }

  /**
   * Get scripts directory
   */
  get scripts() {
    return this.paths.scripts;
  }

  /**
   * Get lib directory
   */
  get lib() {
    return this.paths.lib;
  }

  /**
   * Get tests directory
   */
  get tests() {
    return this.paths.tests;
  }

  // ============================================
  // CONTENT-SPECIFIC PATHS
  // ============================================

  /**
   * Get blog data file path
   */
  get blogData() {
    return this.paths.blogData;
  }

  /**
   * Get blog posts directory
   */
  get posts() {
    return this.paths.posts;
  }

  /**
   * Get docs directory (if content type is docs)
   */
  get docs() {
    return join(this.content, 'docs');
  }

  /**
   * Get portfolio directory (if content type is portfolio)
   */
  get portfolio() {
    return join(this.content, 'portfolio');
  }

  // ============================================
  // CONFIGURATION FILE PATHS
  // ============================================

  /**
   * Get Clodo config file path
   */
  get clodoConfig() {
    return this.paths.clodoConfig;
  }

  /**
   * Get package.json path
   */
  get packageJson() {
    return this.paths.packageJson;
  }

  /**
   * Get wrangler.toml path
   */
  get wranglerToml() {
    return this.paths.wranglerToml;
  }

  /**
   * Get vite config path
   */
  get viteConfig() {
    return this.paths.viteConfig;
  }

  /**
   * Get playwright config path
   */
  get playwrightConfig() {
    return this.paths.playwrightConfig;
  }

  // ============================================
  // OUTPUT PATHS
  // ============================================

  /**
   * Get critical CSS path
   */
  get criticalCss() {
    return this.paths.criticalCss;
  }

  /**
   * Get sitemap path
   */
  get sitemap() {
    return this.paths.sitemap;
  }

  /**
   * Get robots.txt path
   */
  get robots() {
    return this.paths.robots;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get template file path
   * @param {string} name - Template name (without extension)
   * @returns {string} Full template file path
   */
  getTemplate(name) {
    return join(this.templates, `${name}.html`);
  }

  /**
   * Get component template path
   * @param {string} name - Component name
   * @returns {string} Full component template path
   */
  getComponent(name) {
    return join(this.templates, 'components', `${name}.html`);
  }

  /**
   * Get partial template path
   * @param {string} name - Partial name
   * @returns {string} Full partial template path
   */
  getPartial(name) {
    return join(this.templates, 'partials', `${name}.html`);
  }

  /**
   * Get content file path
   * @param {string} type - Content type (blog, docs, etc.)
   * @param {string} name - Content name
   * @returns {string} Full content file path
   */
  getContentFile(type, name) {
    return join(this.content, type, `${name}.md`);
  }

  /**
   * Get data file path
   * @param {string} name - Data file name
   * @returns {string} Full data file path
   */
  getDataFile(name) {
    return join(this.data, `${name}.json`);
  }

  /**
   * Get build script path
   * @param {string} name - Script name
   * @returns {string} Full build script path
   */
  getBuildScript(name) {
    return join(this.build, `${name}.js`);
  }

  /**
   * Get tool script path
   * @param {string} name - Tool name
   * @returns {string} Full tool script path
   */
  getTool(name) {
    return join(this.tools, `${name}.js`);
  }

  /**
   * Resolve path relative to root
   * @param {string} path - Path to resolve
   * @returns {string} Absolute path
   */
  resolve(path) {
    return resolve(this.root, path);
  }

  /**
   * Join path with root
   * @param {...string} paths - Paths to join
   * @returns {string} Joined path
   */
  join(...paths) {
    return join(this.root, ...paths);
  }

  /**
   * Get all template files
   * @returns {string[]} Array of template file paths
   */
  getTemplateFiles() {
    // This would need fs operations, but we'll implement in the build system
    return [];
  }

  /**
   * Get all content files
   * @param {string} type - Content type filter
   * @returns {string[]} Array of content file paths
   */
  getContentFiles(type = null) {
    // This would need fs operations, but we'll implement in the content system
    return [];
  }

  /**
   * Check if path exists relative to root
   * @param {string} path - Path to check
   * @returns {boolean} Whether path exists
   */
  exists(path) {
    const { existsSync } = require('fs');
    return existsSync(this.resolve(path));
  }

  /**
   * Get relative path from one path to another
   * @param {string} from - From path
   * @param {string} to - To path
   * @returns {string} Relative path
   */
  relative(from, to) {
    const { relative } = require('path');
    return relative(from, to);
  }

  /**
   * Export path configuration for debugging
   */
  export() {
    return {
      root: this.root,
      paths: this.paths,
      config: {
        sourceDir: this._config.get('build.sourceDir'),
        publicDir: this._config.get('build.publicDir'),
        outputDir: this._config.get('build.outputDir'),
        templatesDir: this._config.get('build.templatesDir'),
        contentDir: this._config.get('build.contentDir'),
        dataDir: this._config.get('build.dataDir')
      }
    };
  }
}

// Default export for convenience
export default PathManager;
