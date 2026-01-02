/**
 * Build Engine
 * Orchestrates the build process using modular components
 */

import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export class BuildEngine {
  constructor(config, paths) {
    this.config = config;
    this.paths = paths;
    this.isWatching = false;
  }

  /**
   * Main build orchestration
   */
  async build() {
    const startTime = Date.now();

    try {
      console.log(chalk.blue('🚀 Building with Clodo Framework...'));
      console.log(chalk.gray(`   Site: ${this.config.get('site.name')}`));
      console.log(chalk.gray(`   Environment: ${this.config.getEnvironment()}`));
      console.log(chalk.gray(`   Output: ${this.paths.dist}`));

      // Execute build pipeline
      await this.clean();
      await this.validateConfiguration();
      await this.processTemplates();
      await this.processContent();
      await this.optimizeAssets();
      await this.generateMetadata();
      await this.validateBuild();

      const buildTime = Date.now() - startTime;
      console.log(chalk.green(`✅ Build completed in ${buildTime}ms`));

      return { success: true, buildTime };

    } catch (error) {
      console.error(chalk.red(`❌ Build failed: ${error.message}`));
      if (this.config.getEnvironment() === 'development') {
        console.error(error.stack);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean output directory
   */
  async clean() {
    console.log(chalk.gray('🧹 Cleaning output directory...'));

    const distDir = this.paths.dist;
    if (existsSync(distDir)) {
      rmSync(distDir, { recursive: true, force: true });
    }
    mkdirSync(distDir, { recursive: true });
  }

  /**
   * Validate configuration before build
   */
  async validateConfiguration() {
    console.log(chalk.gray('🔍 Validating configuration...'));

    // Check required directories exist
    const requiredDirs = [this.paths.templates, this.paths.content, this.paths.data];
    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        throw new Error(`Required directory not found: ${dir}`);
      }
    }

    // Validate content type specific requirements
    const contentType = this.config.get('content.type');
    if (contentType === 'blog' && !existsSync(this.paths.blogData)) {
      console.warn(chalk.yellow(`⚠️  Blog data file not found: ${this.paths.blogData}`));
    }
  }

  /**
   * Process HTML templates
   */
  async processTemplates() {
    console.log(chalk.gray('📄 Processing templates...'));

    const { TemplateProcessor } = await import('./template-processor.js');
    const processor = new TemplateProcessor(this.config, this.paths);
    await processor.process();
  }

  /**
   * Process content files
   */
  async processContent() {
    console.log(chalk.gray('📝 Processing content...'));

    const { ContentProcessor } = await import('./content-processor.js');
    const processor = new ContentProcessor(this.config, this.paths);
    await processor.process();
  }

  /**
   * Optimize assets
   */
  async optimizeAssets() {
    console.log(chalk.gray('🎨 Optimizing assets...'));

    const { AssetOptimizer } = await import('./asset-optimizer.js');
    const optimizer = new AssetOptimizer(this.config, this.paths);
    await optimizer.optimize();
  }

  /**
   * Generate metadata and special files
   */
  async generateMetadata() {
    console.log(chalk.gray('🏷️  Generating metadata...'));

    const { MetadataGenerator } = await import('./metadata-generator.js');
    const generator = new MetadataGenerator(this.config, this.paths);
    await generator.generate();
  }

  /**
   * Validate build output
   */
  async validateBuild() {
    console.log(chalk.gray('✅ Validating build output...'));

    const { BuildValidator } = await import('./build-validator.js');
    const validator = new BuildValidator(this.config, this.paths);
    await validator.validate();
  }

  /**
   * Watch for changes and rebuild
   */
  async watch() {
    console.log(chalk.blue('👀 Starting watch mode...'));

    const { watch } = await import('chokidar');

    // Watch directories for changes
    const watchPaths = [
      this.paths.templates,
      this.paths.content,
      this.paths.data,
      this.paths.src,
      this.paths.public
    ];

    const watcher = watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    // Rebuild on changes
    watcher.on('change', async (path) => {
      console.log(chalk.cyan(`📝 File changed: ${path}`));
      await this.build();
    });

    watcher.on('add', async (path) => {
      console.log(chalk.green(`➕ File added: ${path}`));
      await this.build();
    });

    watcher.on('unlink', async (path) => {
      console.log(chalk.red(`➖ File removed: ${path}`));
      await this.build();
    });

    // Keep process alive
    console.log(chalk.gray('   Watching for changes... (Ctrl+C to stop)'));
    await new Promise(() => {}); // Never resolves
  }

  /**
   * Analyze build output
   */
  async analyze() {
    console.log(chalk.blue('📊 Analyzing build output...'));

    const { BuildAnalyzer } = await import('./build-analyzer.js');
    const analyzer = new BuildAnalyzer(this.config, this.paths);
    await analyzer.analyze();
  }

  /**
   * Get build statistics
   */
  getStats() {
    // This would analyze the build output and return statistics
    return {
      buildTime: 0,
      fileCount: 0,
      totalSize: 0,
      optimizations: []
    };
  }
}

// Default export for convenience
export default BuildEngine;