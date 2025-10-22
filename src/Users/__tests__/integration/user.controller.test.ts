// src/Users/__tests__/integration/user.controller.test.ts
import request from 'supertest';
import express from 'express';
import { register, login, getProfile, setUserService } from '../../infraestructure/controllers/user.controller';
import { UserService } from '../../application/user.service';
import { MySQLUserRepository } from '../../infraestructure/repositories/user.repository.msql';

// Mock del servicio
jest.mock('../../application/user.service');
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('User Controller Integration Tests', () => {
  let app: express.Application;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockUserService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      saveRefreshToken: jest.fn(),
      validateRefreshToken: jest.fn(),
      updateAccount: jest.fn(),
      replaceAccount: jest.fn(),
      deleteAccount: jest.fn(),
      verifyEmail: jest.fn(),
      logout: jest.fn()
    } as any;

  MockedUserService.mockImplementation(() => mockUserService);
  // Inyectar la instancia mock directamente al controlador
  setUserService(mockUserService);

    app.post('/auth/register', register);
    app.post('/auth/login', login);
    app.get('/users/me', getProfile);
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: 1234567890,
        address: 'Test Address'
      };

      mockUserService.register.mockResolvedValue({
        id: 1,
        verificationToken: 'token123'
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Usuario creado. Revisa tu correo para confirmar email.');
      expect(response.body.userId).toBe(1);
      expect(response.body.verificationToken).toBe('token123');
    });

    it('should return error for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      mockUserService.login.mockResolvedValue({
        id: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      } as any);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.access_token).toBe('access-token');
      expect(response.body.refresh_token).toBe('refresh-token');
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserService.login.mockRejectedValue({
        status: 401,
        message: 'Contraseña incorrecta'
      });

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Contraseña incorrecta');
    });
  });
});