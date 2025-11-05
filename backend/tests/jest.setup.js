// Jest setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.PORT = '5001';

// Suppress console.log during tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();