import { describe, it, expect } from 'vitest';
import { minifyJs } from '../../build/utils/minify.js';

describe('minifyJs', () => {
  it('does not break regex literals containing slashes', () => {
    const input = `const key = href.replace(/^\\\//, '');\nif (manifest[key]) { ln.setAttribute('href', '/' + manifest[key]); }`;
    const output = minifyJs(input);

    // Ensure regex literal still contains "/^\\/..." sequence (escaped slash remains)
    expect(output).toContain('/^\\//');
    // Ensure the if statement remains intact
    expect(output).toContain('if (manifest[key])');
  });
});
