#!/usr/bin/env node

/**
 * CSS Analysis Runner
 *
 * Quick script to run CSS analysis from the CSS folder
 * Usage: node run-analysis.js
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    console.log('🚀 Running CSS Architecture Analysis...\n');
    console.log('📁 Analyzing CSS files in:', __dirname);

    // Get the project root (two levels up from public/css)
    const projectRoot = path.resolve(__dirname, '..', '..');
    console.log('📊 This may take a few moments for large codebases...\n');

    // Run the analysis script from project root
    execSync('node public/css/css-analysis.js', {
        cwd: projectRoot,
        stdio: 'inherit'
    });

    console.log('\n📋 Results saved to: public/css/CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md');
    console.log('🔗 See improvement recommendations in the plan document');

} catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
}