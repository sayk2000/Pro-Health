require('dotenv').config();

const env = process.env.ENVIRONMENT || 'test';

const environments = {
  test: {
    baseUrl: process.env.BASE_URL || 'https://coloplast-prohealth-test.bbsystemstest.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://coloplast-prohealth-test.bbsystemstest.com',
  },
  staging: {
    baseUrl: process.env.BASE_URL || 'https://staging.your-app.example.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://staging-api.your-app.example.com',
  },
  prod: {
    baseUrl: process.env.BASE_URL || 'https://your-app.example.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.your-app.example.com',
  },
};

const selected = environments[env] || environments.test;

// Normalize: strip any trailing slash so callers can safely append paths.
const baseUrl = selected.baseUrl.replace(/\/+$/, '');
const apiBaseUrl = selected.apiBaseUrl.replace(/\/+$/, '');

// App-specific paths for ProHealth.
const paths = {
  login: '/account/login',
  home: '/app',
};

const config = {
  env,
  baseUrl,
  apiBaseUrl,
  paths,
  // Convenience absolute URLs.
  loginUrl: `${baseUrl}${paths.login}`,
  homeUrl: `${baseUrl}${paths.home}`,
  credentials: {
    email: process.env.TEST_EMAIL || 'systemadmin@blueberrysystems.co.uk',
    password: process.env.TEST_PASSWORD || '',
  },
};

module.exports = config;
