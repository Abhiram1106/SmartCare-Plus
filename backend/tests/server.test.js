const mongoose = require('mongoose');
const app = require('../server'); // Adjust the path as necessary
const request = require('supertest');

let server;

beforeAll(async () => {
  server = app.listen(5001); // Use a different port for testing
  await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

test('hello world!', async () => {
  const response = await request(server).get('/');
  expect(response.statusCode).toBe(200);
});