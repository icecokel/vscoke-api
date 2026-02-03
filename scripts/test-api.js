const http = require('http');

const url = 'http://127.0.0.1:3000/wordle/word';

function makeRequest(index) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`#${index}: ${data}`);
          resolve();
        });
      })
      .on('error', (err) => {
        console.error(`#${index}: Error - ${err.message}`);
        reject(err);
      });
  });
}

async function runTest() {
  for (let i = 1; i <= 10; i++) {
    await makeRequest(i);
  }
}

runTest();
