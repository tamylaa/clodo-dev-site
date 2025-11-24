/**
 * Unit tests for script.js functionality
 */

import {
  setupSmoothScrolling,
  showNotification
} from '../public/script.js';

// Load functions from separate modules
import { fetchGitHubStars } from '../public/js/github-integration.js';
import { setupScrollAnimations } from '../public/js/scroll-animations.js';

describe('GitHub Stars Fetching', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="github-stars">0</span>
      <span id="star-count">0</span>
    `;
  });

  test('successfully fetches and displays GitHub stars', async () => {
    const mockResponse = {
      stargazers_count: 42
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await fetchGitHubStars();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tamylaa/clodo-framework',
      expect.objectContaining({ timeout: 5000 })
    );

    const starElements = document.querySelectorAll('#github-stars, #star-count');
    expect(starElements[0].textContent).toBe('42');
    expect(starElements[1].textContent).toBe('42');
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    global.localStorage.getItem.mockReturnValue('25');

    await fetchGitHubStars();

    const starElements = document.querySelectorAll('#github-stars, #star-count');
    expect(starElements[0].textContent).toBe('25');
    expect(starElements[1].textContent).toBe('25');
  });

  test('handles invalid API response', async () => {
    // Ensure no cached value interferes with fallback
    global.localStorage.getItem.mockReturnValue(undefined);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stargazers_count: null })
    });

  await fetchGitHubStars();

  const starElements = document.querySelectorAll('#github-stars, #star-count');
  expect(starElements[0].textContent).toBe('—');
  });

  test('caches fallback value in localStorage', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    global.localStorage.getItem.mockReturnValue('30');

    await fetchGitHubStars();

    expect(global.localStorage.setItem).toHaveBeenCalledWith('github-stars-cache', '30');
  });
});

describe('Smooth Scrolling', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a href="#section1">Link</a>
      <div id="section1" style="margin-top: 1000px;">Section 1</div>
    `;

  // Mock scrollTo
  window.scrollTo = vi.fn();
  });

  test('sets up smooth scrolling for anchor links', () => {
    setupSmoothScrolling();

    const link = document.querySelector('a[href^="#"]');
    link.click();

    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
  });

  test('handles non-existent targets gracefully', () => {
    document.body.innerHTML = '<a href="#nonexistent">Link</a>';

    setupSmoothScrolling();

    const link = document.querySelector('a[href^="#"]');

    // Should not throw error
    expect(() => link.click()).not.toThrow();
  });
});

describe('Scroll Animations', () => {
  let mockObserver;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="feature-card">Feature 1</div>
      <div class="testimonial">Testimonial 1</div>
      <div class="stat-item">Stat 1</div>
    `;

    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn()
    };

    global.IntersectionObserver.mockImplementation(() => mockObserver);
  });

  test('sets up intersection observer for animatable elements', () => {
    setupScrollAnimations();

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      })
    );

    expect(mockObserver.observe).toHaveBeenCalledTimes(3);
  });

  test('adds fade-in-up class when elements intersect', () => {
    setupScrollAnimations();

    const [callback] = global.IntersectionObserver.mock.calls[0];
    const mockEntry = {
      isIntersecting: true,
      target: document.querySelector('.feature-card')
    };

    callback([mockEntry]);

    expect(mockEntry.target.classList.contains('fade-in-up')).toBe(true);
  });
});

describe('Notifications', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('displays success notification', () => {
  showNotification('Operation successful!', 'success');

  const notification = document.querySelector('.notification');
  expect(notification).toBeInTheDocument();
  expect(notification).toHaveTextContent('Operation successful!');
  expect(notification.className).toMatch(/notification(-|--)success/);
  });

  test('displays error notification', () => {
  showNotification('Something went wrong!', 'error');

  const notification = document.querySelector('.notification');
  expect(notification).toBeInTheDocument();
  expect(notification).toHaveTextContent('Something went wrong!');
  expect(notification.className).toMatch(/notification(-|--)error/);
  });

  test('auto-removes notification after 5 seconds', async () => {
    jest.useFakeTimers();

    showNotification('Test message', 'info');

    const notification = document.querySelector('.notification');
    expect(notification).toBeInTheDocument();

    // Fast-forward time
  jest.advanceTimersByTime(5300);

  expect(notification).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test('handles unknown notification types', () => {
  showNotification('Unknown type', 'unknown');

  const notification = document.querySelector('.notification');
  // Default fallback is info style
  expect(notification.className).toMatch(/notification(-|--)info/);
  });
});

describe('Error Handling', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('logs global errors', () => {
    const errorEvent = new ErrorEvent('error', {
      error: new Error('Test error'),
      message: 'Test error'
    });

    window.dispatchEvent(errorEvent);

    expect(consoleSpy).toHaveBeenCalledWith('Global error:', expect.any(Error));
  });

  test('handles unhandled promise rejections', () => {
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      reason: 'Test rejection'
    });

    window.dispatchEvent(rejectionEvent);

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled promise rejection:', 'Test rejection');
  });
});