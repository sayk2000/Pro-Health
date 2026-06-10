const { test, expect } = require('@playwright/test');
const config = require('../../config/env.config');
const logger = require('../../utils/logger');
const userData = require('../../test-data/user.json');
const { createUser } = require('../../test-data/factories/user.factory');

test.describe('User API', { tag: '@regression' }, () => {
  test('GET /users returns 200', { tag: ['@smoke', '@critical'] }, async ({ request }) => {
    logger.info(`GET ${config.apiBaseUrl}/users`);
    const response = await request.get(`${config.apiBaseUrl}/users`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('POST /users creates a user from static data', { tag: '@smoke' }, async ({ request }) => {
    const payload = userData.newUser;
    logger.info(`POST ${config.apiBaseUrl}/users payload=${JSON.stringify(payload)}`);
    const response = await request.post(`${config.apiBaseUrl}/users`, { data: payload });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.name).toBe(payload.name);
  });

  test('POST /users creates a user from faker', { tag: '@regression' }, async ({ request }) => {
    const fakeUser = createUser({ job: 'QA Engineer' });
    const payload = { name: fakeUser.fullName, job: fakeUser.job };
    logger.info(`POST ${config.apiBaseUrl}/users payload=${JSON.stringify(payload)}`);
    const response = await request.post(`${config.apiBaseUrl}/users`, { data: payload });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.name).toBe(payload.name);
    expect(body.id).toBeDefined();
  });

  test('GET /users/1 returns single user', { tag: '@regression' }, async ({ request }) => {
    const response = await request.get(`${config.apiBaseUrl}/users/1`);
    expect(response.status()).toBe(200);
  });

  test('GET unknown route returns 404', { tag: '@regression' }, async ({ request }) => {
    const response = await request.get(`${config.apiBaseUrl}/unknown-route-xyz`);
    expect([404, 400]).toContain(response.status());
  });
});
