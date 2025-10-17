// src/Users/__tests__/unit/user.service.test.ts
import { UserService } from '../../application/user.service';
import { IUserRepository } from '../../infraestructure/repositories/user.repository';
import { AuthService } from '../../Authentication/auth.service';
import bcrypt from 'bcryptjs';
import { User } from '../../domain/user.entity';

// Mock del repositorio con tipos correctos
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

// Mock de bcryptjs — usar fábrica para exponer hash/compare como jest.fn()
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
const mockedBcrypt = bcrypt as unknown as { hash: jest.Mock; compare: jest.Mock };

// Mock de AuthService
jest.mock('../../Authentication/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    userService = new UserService(mockRepository);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: 1234567890,
        address: 'Test Address'
      };

      const hashedPassword = 'hashedPassword123';
      const verificationToken = 'verification-token-123';
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const userId = 1;

  // Mock de bcrypt.hash
  (mockedBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      // Mock del repositorio
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(userId);

      // Mock de crypto para el token
      const mockCrypto = require('crypto');
      mockCrypto.randomBytes = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue(verificationToken)
      });

  // Act
  const result = await userService.register(userData as any);

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        verification_token: verificationToken,
        verification_expires: expect.any(Date)
      });
      expect(result.id).toBe(userId);
      expect(result.verificationToken).toBe(verificationToken);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: 1234567890,
        address: 'Test Address'
      };

      const existingUser: User = {
        id: 1,
        name: 'Existing User',
        email: userData.email,
        password: 'hashedPassword',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: false
      };

      mockRepository.findByEmail.mockResolvedValue(existingUser);

  // Act & Assert
  await expect(userService.register(userData as any)).rejects.toThrow('El correo ya está registrado');
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const hashedPassword = 'hashedPassword123';
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-123';

      const mockUser: User = {
        id: 1,
        email,
        password: hashedPassword,
        name: 'Test User',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: true
      };

      // Mock del repositorio
      mockRepository.findByEmail.mockResolvedValue(mockUser);
      mockRepository.resetFailedAttempts.mockResolvedValue();
      mockRepository.saveToken.mockResolvedValue();

  // Mock de bcrypt.compare
  (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock de AuthService
      MockedAuthService.generateAccessToken.mockReturnValue(accessToken);
      MockedAuthService.generateRefreshToken.mockReturnValue(refreshToken);

      // Act
      const result = await userService.login(email, password);

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockRepository.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
      expect(MockedAuthService.generateAccessToken).toHaveBeenCalledWith({ id: mockUser.id, email });
      expect(MockedAuthService.generateRefreshToken).toHaveBeenCalledWith({ id: mockUser.id, email });
      expect(result.id).toBe(mockUser.id);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedPassword123';

      const mockUser: User = {
        id: 1,
        email,
        password: hashedPassword,
        name: 'Test User',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: true
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);
  (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(userService.login(email, password)).rejects.toMatchObject({
        status: 401,
        message: 'Contraseña incorrecta'
      });
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'Password123';

      mockRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.login(email, password)).rejects.toMatchObject({
        status: 404,
        message: 'Usuario no encontrado'
      });
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should lock account after 3 failed attempts', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedPassword123';

      const mockUser: User = {
        id: 1,
        email,
        password: hashedPassword,
        name: 'Test User',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 2, // 2 intentos fallidos previos
        locked_until: null,
        is_verified: true
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);
      mockRepository.incrementFailedAttempts.mockResolvedValue();
      mockRepository.lockUser.mockResolvedValue();

      // Act & Assert
      await expect(userService.login(email, password)).rejects.toMatchObject({
        status: 403,
        message: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.'
      });
      expect(mockRepository.incrementFailedAttempts).toHaveBeenCalledWith(mockUser.id);
      expect(mockRepository.lockUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if account is locked', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos en el futuro

      const mockUser: User = {
        id: 1,
        email,
        password: 'hashedPassword',
        name: 'Test User',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 3,
        locked_until: lockedUntil,
        is_verified: true
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.login(email, password)).rejects.toMatchObject({
        status: 403,
        message: 'Cuenta bloqueada temporalmente. Intenta más tarde'
      });
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const token = 'verification-token-123';
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: false,
        verification_token: token,
        verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockRepository.findByVerificationToken.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue();

      // Act
      const result = await userService.verifyEmail(token);

      // Assert
      expect(mockRepository.findByVerificationToken).toHaveBeenCalledWith(token);
      expect(mockRepository.update).toHaveBeenCalledWith(mockUser.id, {
        verification_token: null,
        verification_expires: null
      });
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw error if token is missing', async () => {
      // Act & Assert
      await expect(userService.verifyEmail('')).rejects.toMatchObject({
        status: 400,
        message: 'Token de verificación faltante'
      });
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid-token';

      mockRepository.findByVerificationToken.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.verifyEmail(invalidToken)).rejects.toMatchObject({
        status: 404,
        message: 'Token inválido o usuario no encontrado'
      });
    });

    it('should throw error if token has expired', async () => {
      // Arrange
      const expiredToken = 'expired-token';
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: false,
        verification_token: expiredToken,
        verification_expires: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expirado
      };

      mockRepository.findByVerificationToken.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.verifyEmail(expiredToken)).rejects.toMatchObject({
        status: 400,
        message: 'El token ha expirado'
      });
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        name: 'Updated Name',
        phone: 9876543210
      };

      const mockUser: User = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: true
      };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue();

      // Act
      const result = await userService.updateAccount(userId, updateData);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result.message).toBe('Usuario actualizado parcialmente');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 999;
      const updateData = { name: 'Updated Name' };

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateAccount(userId, updateData)).rejects.toMatchObject({
        status: 404,
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      // Arrange
      const userId = 1;
      const mockUser: User = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phone: 1234567890,
        address: 'Test Address',
        created_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        is_verified: true
      };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue();

      // Act
      const result = await userService.deleteAccount(userId);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
      expect(result.message).toBe('Usuario eliminado correctamente');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 999;

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteAccount(userId)).rejects.toMatchObject({
        status: 404,
        message: 'Usuario no encontrado'
      });
    });
  });
});