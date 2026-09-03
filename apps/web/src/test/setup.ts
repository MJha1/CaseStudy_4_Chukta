import '@testing-library/jest-dom/vitest';

// jsdom lacks these; stub so components that touch them don't crash in tests.
if (!('randomUUID' in crypto)) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => `test-${Math.random().toString(36).slice(2)}`,
  });
}
