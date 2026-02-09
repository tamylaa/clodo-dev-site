import { existsSync, rmSync, mkdirSync } from 'fs';

/** Remove and re-create the dist directory */
export function cleanDist() {
    console.log('[CLEAN] Cleaning dist directory...');
    if (existsSync('dist')) {
        rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
}
