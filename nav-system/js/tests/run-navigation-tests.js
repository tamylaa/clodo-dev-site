#!/usr/bin/env node

/**
 * Navigation Test Runner
 * 
 * Convenience script that:
 * 1. Builds the project
 * 2. Starts dev server
 * 3. Runs navigation tests
 * 4. Stops server
 * 
 * Usage: npm run test:navigation:full
 */

import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

console.log('🚀 Navigation Test Runner\n');

// Step 1: Build
console.log('📦 Building project...');
const build = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
});

build.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Build failed');
        process.exit(1);
    }
    
    console.log('✅ Build complete\n');
    
    // Step 2: Start server
    console.log('🌐 Starting dev server...');
    const server = spawn('node', ['build/dev-server.js'], {
        stdio: 'pipe',
        shell: true
    });
    
    // Wait for server to be ready
    let serverReady = false;
    server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output.trim());
        
        if (output.includes('running at')) {
            serverReady = true;
            
            // Step 3: Run tests
            setTimeout(() => {
                console.log('\n🧪 Running navigation tests...\n');
                const tests = spawn('node', ['tests/navigation-test.js'], {
                    stdio: 'inherit',
                    shell: true
                });
                
                tests.on('close', (testCode) => {
                    // Step 4: Stop server
                    console.log('\n🛑 Stopping server...');
                    server.kill();
                    
                    if (testCode === 0) {
                        console.log('✅ All tests passed!');
                    } else {
                        console.log('❌ Some tests failed');
                    }
                    
                    process.exit(testCode);
                });
            }, 2000); // Wait 2 seconds for server to fully initialize
        }
    });
    
    server.stderr.on('data', (data) => {
        console.error(data.toString());
    });
    
    server.on('close', () => {
        if (!serverReady) {
            console.error('❌ Server failed to start');
            process.exit(1);
        }
    });
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n🛑 Interrupted - cleaning up...');
        server.kill();
        process.exit(0);
    });
});
