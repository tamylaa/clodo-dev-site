// Test setup and global configurations
import 'jest-dom/extend-expect';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {
    this.readyState = 1;
  }
  send() {}
  close() {}
};

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
    prepare: jest.fn(() => ({
      bind: jest.fn(() => ({
        first: jest.fn(),
        all: jest.fn(),
        run: jest.fn()
      }))
    }))
  },
  CACHE: new Map(),
  ...overrides
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  document.body.innerHTML = '';
});