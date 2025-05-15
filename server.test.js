const request = require('supertest');
const app = require('./server');

jest.mock('@gomomento/sdk', () => {
  const original = jest.requireActual('@gomomento/sdk');
  return {
    ...original,
    CredentialProvider: {
      fromString: jest.fn().mockReturnValue({}),
    },
    AuthClient: jest.fn().mockImplementation(() => ({
      generateDisposableToken: jest.fn().mockImplementation((permissions, expiry) => {
        return Promise.resolve({ authToken: 'mocked-token' });
      }),
    })),
  };
});

describe('GET /token', () => {
  it('returns a visitor token with valid visitorId and agentId', async () => {
    const res = await request(app)
      .get('/token')
      .query({ visitorId: 'abc123', agentId: 'xyz456' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token', 'mocked-token');
  });

  it('returns an agent token with only agentId', async () => {
    const res = await request(app)
      .get('/token')
      .query({ agentId: 'xyz456' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token', 'mocked-token');
  });

  it('returns 400 if agentId is missing', async () => {
    const res = await request(app)
      .get('/token')
      .query({ visitorId: 'abc123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
