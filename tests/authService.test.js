const { registerUser, loginUser } = require('../src/services/authService');
const User = require('../src/models/User');

// Mock User model
jest.mock('../src/models/User');

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    it('should throw if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' });
      await expect(registerUser({ name: 'Test', email: 'test@test.com', password: '123456' }))
        .rejects.toMatchObject({ message: 'Email already registered.', statusCode: 409 });
    });

    it('should create user and return token', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: 'user123', name: 'Test', email: 'test@test.com', role: 'member' });
      process.env.JWT_SECRET = 'testsecret';

      const result = await registerUser({ name: 'Test', email: 'test@test.com', password: '123456' });
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('loginUser', () => {
    it('should throw if credentials are invalid', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await expect(loginUser({ email: 'bad@test.com', password: 'wrong' }))
        .rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
