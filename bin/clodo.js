#!/usr/bin/env node

/**
 * Clodo Framework CLI
 * Command-line interface for the Clodo Framework
 */

import { Command } from 'commander';
import { ConfigManager } from '../lib/config.js';
import { PathManager } from '../lib/paths.js';
import chalk from 'chalk';

const program = new Command();

// CLI Configuration
program
  .name('clodo')
  .description('Clodo Framework - Build high-performance websites with Cloudflare')
  .version('2.0.0-beta.1')
  .option('-c, --config <path>', 'path to config file', 'clodo.config.js')
  .option('-v, --verbose', 'enable verbose output')
  .option('--dry-run', 'show what would be done without executing');

// Global setup
program.action(async (options) => {
  try {
    // Initialize configuration and paths
    const configManager = new ConfigManager(options.config);
    const config = await configManager.initialize();
    const paths = new PathManager(config);

    // Make available globally for subcommands
    global.clodo = { config, paths, options };

    if (options.verbose) {
      console.log(chalk.blue('🔧 Clodo Framework initialized'));
      console.log(chalk.gray(`   Config: ${options.config}`));
      console.log(chalk.gray(`   Environment: ${config.getEnvironment()}`));
      console.log(chalk.gray(`   Site: ${config.get('site.name')} (${config.get('site.domain')})`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Initialization failed: ${error.message}`));
    process.exit(1);
  }
});

// ============================================
// CORE COMMANDS
// ============================================

// Init command
program
  .command('init')
  .description('Initialize a new Clodo project')
  .option('-t, --template <type>', 'project template (blog|docs|portfolio|landing)', 'blog')
  .option('-f, --force', 'overwrite existing files')
  .action(async (options) => {
    const { initProject } = await import('../lib/init.js');
    await initProject(options.template, options);
  });

// Build command
program
  .command('build')
  .description('Build the project')
  .option('-w, --watch', 'watch for changes and rebuild')
  .option('-a, --analyze', 'analyze build output')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager(options.config || 'clodo.config.js');
      const config = await configManager.initialize();
      const paths = new PathManager(config);

      const { ClodoFramework } = await import('../lib/framework.js');
      const framework = new ClodoFramework(config);
      await framework.build();
    } catch (error) {
      console.error(chalk.red(`❌ Build failed: ${error.message}`));
      process.exit(1);
    }
  });

// Development server command
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'port to run on', '3000')
  .option('-h, --host <host>', 'host to bind to', 'localhost')
  .option('-o, --open', 'open browser automatically')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager(options.config || 'clodo.config.js');
      const config = await configManager.initialize();
      const paths = new PathManager(config);

      const { ClodoFramework } = await import('../lib/framework.js');
      const framework = new ClodoFramework(config);
      await framework.dev();
    } catch (error) {
      console.error(chalk.red(`❌ Dev server failed: ${error.message}`));
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy to production')
  .option('-e, --environment <env>', 'environment to deploy to', 'production')
  .option('-m, --message <msg>', 'deployment message')
  .action(async (options) => {
    const { DeployEngine } = await import('../lib/deploy.js');
    const deployEngine = new DeployEngine(global.clodo.config, global.clodo.paths);
    await deployEngine.deploy(options.environment, options.message);
  });

// ============================================
// ASSESSMENT & ANALYSIS COMMANDS
// ============================================

// Analyze command
program
  .command('analyze')
  .description('Analyze project and provide recommendations')
  .option('--fix', 'automatically fix issues')
  .action(async (options) => {
    const { ProjectAnalyzer } = await import('../lib/analyzer.js');
    const analyzer = new ProjectAnalyzer(global.clodo.config, global.clodo.paths);
    const results = await analyzer.analyze();

    if (options.fix) {
      await analyzer.fix(results);
    }
  });

// Assess command (from clodo-orchestration)
program
  .command('assess')
  .description('Run capability assessment using clodo-orchestration')
  .option('--fix', 'automatically apply fixes')
  .action(async (options) => {
    const { ProjectAssessor } = await import('../lib/assessment.js');
    const assessor = new ProjectAssessor(global.clodo.config, global.clodo.paths);
    await assessor.assess();

    if (options.fix) {
      await assessor.fix();
    }
  });

// ============================================
// CONTENT MANAGEMENT COMMANDS
// ============================================

// Content commands
program
  .command('content')
  .description('Content management commands')
  .addCommand(
    new Command('generate')
      .description('Generate content from templates')
      .option('-t, --type <type>', 'content type (post|page|doc)', 'post')
      .option('-n, --name <name>', 'content name/slug')
      .action(async (options) => {
        const { ContentGenerator } = await import('../lib/content.js');
        const generator = new ContentGenerator(global.clodo.config, global.clodo.paths);
        await generator.generate(options.type, options.name);
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate content integrity')
      .action(async () => {
        const { ContentValidator } = await import('../lib/content.js');
        const validator = new ContentValidator(global.clodo.config, global.clodo.paths);
        await validator.validate();
      })
  );

// ============================================
// UTILITY COMMANDS
// ============================================

// Config command
program
  .command('config')
  .description('Configuration management')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .action(async () => {
        const configManager = new ConfigManager();
        const config = await configManager.initialize();
        console.log(JSON.stringify(config.export(), null, 2));
      })
  )
  .addCommand(
    new Command('paths')
      .description('Show path configuration')
      .action(async () => {
        const configManager = new ConfigManager();
        const config = await configManager.initialize();
        const paths = new PathManager(config);
        console.log(JSON.stringify(paths.export(), null, 2));
      })
  );

// Clean command
program
  .command('clean')
  .description('Clean build artifacts and caches')
  .option('-a, --all', 'clean all caches and dependencies')
  .action(async (options) => {
    const { Cleaner } = await import('../lib/clean.js');
    const cleaner = new Cleaner(global.clodo.config, global.clodo.paths);
    await cleaner.clean(options.all);
  });

// ============================================
// INTERACTIVE MODE
// ============================================

// Interactive command
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode with guided workflows')
  .action(async () => {
    const { InteractiveWizard } = await import('../lib/interactive.js');
    const wizard = new InteractiveWizard(global.clodo.config, global.clodo.paths);
    await wizard.start();
  });

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Legacy orchestrate command (for backward compatibility)
program
  .command('orchestrate')
  .description('Legacy orchestrate command (use assess instead)')
  .action(async () => {
    console.log(chalk.yellow('⚠️  "orchestrate" is deprecated. Use "assess" instead.'));
    const { ProjectAssessor } = await import('../lib/assessment.js');
    const assessor = new ProjectAssessor(global.clodo.config, global.clodo.paths);
    await assessor.assess();
  });

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red(`❌ Uncaught Exception: ${error.message}`));
  if (global.clodo?.options?.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red(`❌ Unhandled Rejection: ${reason}`));
  if (global.clodo?.options?.verbose) {
    console.error(promise);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.blue('\n👋 Shutting down gracefully...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.blue('\n👋 Shutting down gracefully...'));
  process.exit(0);
});

// ============================================
// EXECUTE CLI
// ============================================

program.parse();