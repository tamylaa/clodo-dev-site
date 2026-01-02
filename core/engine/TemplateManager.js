import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export class TemplateManager {
    constructor(layoutsDir, componentsDir) {
        this.layoutsDir = layoutsDir;
        this.componentsDir = componentsDir;
        this.layouts = new Map();
        this.components = new Map();
    }

    loadAll() {
        this._loadDirectory(this.layoutsDir, this.layouts);
        this._loadDirectory(this.componentsDir, this.components);
        console.log(`[TemplateManager] Loaded ${this.layouts.size} layouts and ${this.components.size} components.`);
    }

    _loadDirectory(dir, map) {
        if (!existsSync(dir)) return;
        
        const files = readdirSync(dir);
        for (const file of files) {
            if (extname(file) === '.html') {
                const name = basename(file, '.html');
                const content = readFileSync(join(dir, file), 'utf8');
                map.set(name, content);
            }
        }
    }

    getLayout(name) {
        return this.layouts.get(name) || this.layouts.get('default') || '';
    }

    getComponent(name) {
        return this.components.get(name) || `<!-- Component ${name} not found -->`;
    }

    hasLayout(name) {
        return this.layouts.has(name);
    }
}
