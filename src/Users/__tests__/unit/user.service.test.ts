// src/Users/__tests__/unit/user.service.test.ts
import { UserService } from '../../application/user.service';
import { IUserRepository } from '../../infraestructure/repositories/user.repository';
import { AuthService } from '../../Authentication/auth.service';
import bcrypt from 'bcryptjs';
import { User } from '../../domain/user.entity';

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';


// Fábrica del repositorio mock
const createMockUserRepository = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  replace: jest.fn(),
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
  findToken: jest.fn(),
  verifyUser: jest.fn(),
  findByVerificationToken: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  lockUser: jest.fn(),
  resetFailedAttempts: jest.fn()
});

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    userService = new UserService(mockUserRepository);
    jest.clearAllMocks();
  });
  

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: 1234567890,
        address: 'Test Address',
        failed_attempts: 0,
        locked_until: null,
        is_verified: false
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(1);

      const result = await userService.register(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.verificationToken).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: 1234567890,
        address: 'Test Address',
        failed_attempts: 0,
        locked_until: null,
        is_verified: false
      };

      mockUserRepository.findByEmail.mockResolvedValue({ id: 1, email: userData.email } as any);

      await expect(userService.register(userData)).rejects.toThrow('El correo ya está registrado');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'Password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const mockUser = {
        id: 1,
        email,
        password: hashedPassword,
        failed_attempts: 0,
        locked_until: null
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockUserRepository.resetFailedAttempts.mockResolvedValue();

      const result = await userService.login(email, password);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result.id).toBe(1);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const mockUser = {
        id: 1,
        email,
        password: hashedPassword,
        failed_attempts: 0,
        locked_until: null
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(userService.login(email, password)).rejects.toMatchObject({
        status: 401,
        message: 'Contraseña incorrecta'
      });
    });
  });
});