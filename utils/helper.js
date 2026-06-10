const fs = require('fs');

function generateEmail(prefix = 'test') {
  return `${prefix}_${Date.now()}@example.com`;
}

function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

async function waitForCondition(checkFn, { timeout = 10_000, interval = 500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await checkFn()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('Condition not met within timeout');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatDate(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

module.exports = {
  generateEmail,
  generateRandomString,
  waitForCondition,
  readJson,
  formatDate,
};
