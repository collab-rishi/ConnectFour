import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const port = process.env.PORT || 8080;
const BACKEND_URL = `http://localhost:${port}`;

describe('Checking Routes', () => {
  test('Check Hello Route', async () => {
    const response = await axios.get(`${BACKEND_URL}`);
    expect(response.status).toBe(200);
  });
});
