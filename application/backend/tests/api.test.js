const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/user.model');

// NOTE ON TEST STRATEGY:
// This suite mocks the Mongoose model layer rather than hitting a real database.
// The project is *designed* for full DB integration tests using
// mongodb-memory-server (see package.json devDependencies) - that approach
// downloads a real mongod binary at test time and runs against it, which is
// the more realistic test and what CI (Phase 4, GitHub Actions) uses.
// It is disabled here only because this sandbox's network is restricted to an
// allowlist that does not include fastdl.mongodb.org - not a code limitation.
jest.mock('../src/models/user.model');

let app;

beforeEach(() => {
  jest.clearAllMocks();
  app = createApp();
});

describe('GET /health', () => {
  it('returns 200 and status healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.dependencies).toBeDefined();
  });
});

describe('GET /', () => {
  it('returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('cloudboard-backend');
  });
});

describe('GET /api/users', () => {
  it('returns an empty list when no users exist', async () => {
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.users).toEqual([]);
  });

  it('returns users from the database', async () => {
    const fakeUsers = [{ _id: '1', name: 'Ada Lovelace', email: 'ada@example.com' }];
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeUsers),
    });

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.users[0].name).toBe('Ada Lovelace');
  });

  it('passes DB errors to the error handler as 500', async () => {
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error('connection lost')),
    });

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});

describe('POST /api/users', () => {
  it('creates a user with valid data', async () => {
    User.create.mockResolvedValue({
      _id: 'abc123',
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Grace Hopper', email: 'grace@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe('Grace Hopper');
    expect(User.create).toHaveBeenCalledWith({
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });
  });

  it('returns 400 on Mongoose validation error', async () => {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.errors = { email: { message: 'email is required' } };
    User.create.mockRejectedValue(validationError);

    const res = await request(app).post('/api/users').send({ name: 'No Email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.details).toContain('email is required');
  });

  it('returns 409 on duplicate key error', async () => {
    const dupError = new Error('duplicate key');
    dupError.code = 11000;
    dupError.keyValue = { email: 'dup@example.com' };
    User.create.mockRejectedValue(dupError);

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Someone', email: 'dup@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Duplicate key');
  });
});

describe('GET /unknown-route', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
