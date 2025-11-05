const http = require('http');

const token = process.argv[2];
const endpoint = process.argv[3] || '/api/analytics/revenue';

if (!token) {
  console.error('Usage: node testEndpoint.js <token> [endpoint]');
  console.error('Example: node testEndpoint.js eyJhbGc... /api/analytics/revenue');
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 5000,
  path: endpoint,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

console.log(`\n🧪 Testing: GET http://localhost:5000${endpoint}\n`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`\nResponse:`);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
