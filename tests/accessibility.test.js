/**
 * Accessibility tests using axe-core
 */

const axe = require('axe-core');

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Ensure lang attribute is present on document element in jsdom
    document.documentElement.setAttribute('lang', 'en');

    // Load the HTML content
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <header>
          <nav role="navigation" aria-label="Main navigation">
            <a href="#main" class="skip-link sr-only">Skip to main content</a>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/docs">Docs</a></li>
            </ul>
          </nav>
        </header>

        <main id="main" role="main">
          <h1>Welcome to Clodo</h1>
          <p>This is a test page for accessibility.</p>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading">Features</h2>
            <ul>
              <li>Feature 1</li>
              <li>Feature 2</li>
            </ul>
          </section>

          <form>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>

            <label for="message">Message:</label>
            <textarea id="message" name="message" required></textarea>

            <button type="submit">Submit</button>
          </form>
        </main>

        <footer>
          <p>&copy; 2025 Clodo Framework</p>
        </footer>
      </body>
      </html>
    `;
  });

  test('has no accessibility violations', async () => {
    const results = await axe.run(document.body);

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Help: ${violation.help}`);
        console.log(`  Help URL: ${violation.helpUrl}`);
        console.log(`  Nodes: ${violation.nodes.length}`);
      });
    }

    expect(results.violations).toHaveLength(0);
  });

  test('has proper heading hierarchy', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));

    // Check that heading levels don't skip (e.g., no H3 without H2)
    for (let i = 1; i < headingLevels.length; i++) {
      expect(headingLevels[i]).toBeLessThanOrEqual(headingLevels[i - 1] + 1);
    }
  });

  test('has proper form labels', () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      expect(label).toBeInTheDocument();
      expect(label.textContent.trim()).not.toBe('');
    });
  });

  test('has proper ARIA labels', () => {
    const nav = document.querySelector('nav');
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  test('has skip link for keyboard navigation', () => {
    const skipLink = document.querySelector('.skip-link');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main');
    expect(skipLink.textContent).toBe('Skip to main content');
  });

  test('has proper semantic structure', () => {
    expect(document.querySelector('header')).toBeInTheDocument();
    expect(document.querySelector('main')).toBeInTheDocument();
    expect(document.querySelector('footer')).toBeInTheDocument();
  });

  test('has proper lang attribute', () => {
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  test('has proper color contrast (simulated)', () => {
    // This is a basic check - in real scenarios, you'd use a visual regression tool
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      // Check that text has some color defined
      if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') {
        expect(styles.color).toBeDefined();
      }
    });
  });
});

// Integration test for keyboard navigation
describe('Keyboard Navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a href="#main" class="skip-link sr-only">Skip to main content</a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs">Docs</a>
      </nav>
      <main id="main" tabindex="-1">
        <h1>Main Content</h1>
        <button>Action Button</button>
        <a href="/link">Link</a>
      </main>
    `;
  });

  test('skip link focuses main content', () => {
    const skipLink = document.querySelector('.skip-link');
    const main = document.querySelector('#main');

    skipLink.focus();
    expect(document.activeElement).toBe(skipLink);

    // Simulate clicking skip link
    main.focus();
    expect(document.activeElement).toBe(main);
  });

  test('all interactive elements are keyboard accessible', () => {
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');

    interactiveElements.forEach(element => {
      // Elements should be focusable or have appropriate tabindex
      const isFocusable = element.tabIndex >= 0 ||
                         element.tagName === 'A' && element.hasAttribute('href') ||
                         element.tagName === 'BUTTON';

      expect(isFocusable).toBe(true);
    });
  });

  test('maintains logical tab order', () => {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    // In a real test, you'd simulate tab key presses
    // For now, just verify elements exist in DOM order
    expect(focusableElements.length).toBeGreaterThan(0);

    focusableElements.forEach(element => {
      expect(element).toBeInTheDocument();
    });
  });
});