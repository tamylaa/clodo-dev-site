/**
 * Clodo Framework API
 * Main entry point for the Clodo Framework
 */

export class ClodoFramework {
  constructor(config) {
    this.config = config;
  }

  async build() {
    const { coreBuild } = await import('../build/core/core-build.js');
    return coreBuild(this.config.config);
  }

  async dev() {
    const { devServer } = await import('../build/core/dev-server.js');
    return devServer(this.config.config);
  }
}