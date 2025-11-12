// Polyfill crypto for tests
const { webcrypto } = require('crypto');
const util = require('util');

Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true
});

// Only define if not already defined (avoid redeclaration)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = util.TextDecoder;
}
