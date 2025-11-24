// Test setup and global configurations
// Extend expect with DOM matchers
import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import assert from 'assert';

// Make assert available globally
global.assert = assert;

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage (override jsdom Storage)
const localStorageMock = (() => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => Array.from(store.keys())[index] || null,
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}

// Mock sessionStorage
const sessionStorageMock = (() => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => Array.from(store.keys())[index] || null,
  };
})();
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true });
}

// Mock IntersectionObserver with vi.fn so tests can mockImplementation
global.IntersectionObserver = vi.fn(function() {
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
    takeRecords: vi.fn(),
  };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock CustomEvent for modal events
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail || {};
  }
};
if (typeof window !== 'undefined') {
  window.CustomEvent = global.CustomEvent;
}

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {
    this.readyState = 1;
  }
  send() {}
  close() {}
};

// Stub canvas getContext used by axe-core
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}));
}

// Stub window.matchMedia for tests
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Stub window.scrollTo to avoid jsdom not-implemented errors
if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = vi.fn();
}

// Polyfill PromiseRejectionEvent for jsdom
if (typeof global.PromiseRejectionEvent === 'undefined') {
  class JSDOMPromiseRejectionEvent extends Event {
    constructor(type, init) {
      super(type);
      this.reason = init && init.reason;
    }
  }
  global.PromiseRejectionEvent = JSDOMPromiseRejectionEvent;
}

// Mock performance API
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
};

// Helper functions for tests
global.createMockRequest = (url, options = {}) => {
  const defaultOptions = {
    method: 'GET',
    headers: new Headers(),
    url: url || 'http://localhost:8787/',
    ...options
  };

  return {
    ...defaultOptions,
    headers: new Headers(defaultOptions.headers),
    json: async () => defaultOptions.body ? JSON.parse(defaultOptions.body) : {},
    text: async () => defaultOptions.body || '',
    formData: async () => new FormData(),
  };
};

global.createMockResponse = (body, options = {}) => {
  const defaultOptions = {
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    ...options
  };

  return {
    ...defaultOptions,
    headers: new Headers(defaultOptions.headers),
    json: async () => body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    ok: defaultOptions.status >= 200 && defaultOptions.status < 300,
  };
};

global.createMockEnv = (overrides = {}) => ({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  GITHUB_TOKEN: 'test-token',
  DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn()
      }))
    }))
  },
  CACHE: new Map(),
  ...overrides
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});