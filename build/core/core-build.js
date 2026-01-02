import { BuildEngine } from '../../core/engine/BuildEngine.js';

/**
 * Core Build Entry Point
 * Delegates to the new modular BuildEngine
 */
export async function coreBuild(config = {}) {
    console.log('[BUILD] Using Modular Build Engine...');
    const engine = new BuildEngine(config);
    await engine.build();
}
