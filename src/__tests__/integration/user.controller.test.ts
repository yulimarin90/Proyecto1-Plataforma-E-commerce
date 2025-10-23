// src/Users/__tests__/integration/user.controller.test.ts
import request from 'supertest';
import express from 'express';
import { register, login, getProfile, updateAccount, deleteAccount, verifyEmail, logout, setUserService } from '../../Users/infraestructure/controllers/user.controller';
import { UserService } from '../../Users/application/user.service';

jest.mock('../../Users/application/user.service');
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('User Controller Integration Tests', () => {
  let app: express.Application;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Middleware de autenticación simulado: si hay Authorization, inyecta req.user
    app.use((req, _res, next) => {
      if (req.headers.authorization) (req as any).user = { id: 1, email: 'test@example.com' };
      next();
    });
    
    mockUserService = {
      register: jest.fn(),
      login: jest.fn(),
      saveRefreshToken: jest.fn(),
      getProfile: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      verifyEmail: jest.fn(),
      logout: jest.fn()
    } as any;

    MockedUserService.mockImplementation(() => mockUserService);
    setUserService(mockUserService);

    app.post('/auth/register', register);
    app.post('/auth/login', login);
  app.get('/users/me', getProfile);
    app.patch('/users/me', updateAccount);
    app.delete('/users/me', deleteAccount);
    app.get('/auth/verify', verifyEmail);
    app.post('/auth/logout', logout);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'Password123', phone: 1234567890, address: 'Test Address' };
      mockUserService.register.mockResolvedValue({ id: 1, verificationToken: 'token123' } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Usuario creado. Revisa tu correo para confirmar email.');
    });

    it('should return error for duplicate email', async () => {
      mockUserService.register.mockRejectedValue({ status: 400, message: 'El correo ya está registrado' });

      await request(app)
        .post('/auth/register')
        .send({ name: 'Test User', email: 'existing@example.com', password: 'Password123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'Password123' };
      mockUserService.login.mockResolvedValue({ id: 1, accessToken: 'access-token', refreshToken: 'refresh-token' } as any);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.access_token).toBe('access-token');
    });

    it('should return error for invalid credentials', async () => {
      mockUserService.login.mockRejectedValue({ status: 401, message: 'Contraseña incorrecta' });

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return error for locked account', async () => {
      mockUserService.login.mockRejectedValue({ status: 403, message: 'Cuenta bloqueada temporalmente' });

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' })
        .expect(403);
    });
  });

  describe('GET /users/me', () => {
    it('should get user profile', async () => {
  const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };

      const response = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return user undefined when missing token (no auth middleware)', async () => {
      const r = await request(app).get('/users/me').expect(200);
      expect(r.body.user).toBeUndefined();
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user account', async () => {
      const updateData = { name: 'Updated Name' };
      mockUserService.updateAccount.mockResolvedValue({ message: 'Usuario actualizado parcialmente' });

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Usuario actualizado parcialmente');
    });

    it('should return server error when service rejects', async () => {
      mockUserService.updateAccount.mockRejectedValue({ status: 404, message: 'Usuario no encontrado' });
      await request(app).patch('/users/me').set('Authorization', 'Bearer valid-token').send({ name: 'Updated Name' }).expect(500);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete user account', async () => {
      mockUserService.deleteAccount.mockResolvedValue({ message: 'Usuario eliminado correctamente' });

      const response = await request(app)
        .delete('/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Usuario eliminado correctamente');
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify email successfully', async () => {
      mockUserService.verifyEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const response = await request(app)
        .get('/auth/verify?token=valid-token')
        .expect(200);

      expect(response.body.message).toBe('Email verificado correctamente');
    });

    it('should return error for invalid token', async () => {
      mockUserService.verifyEmail.mockRejectedValue({ status: 400, message: 'Token inválido' });

      await request(app)
        .get('/auth/verify?token=invalid-token')
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      mockUserService.logout.mockResolvedValue({ message: 'Sesión cerrada exitosamente' });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Sesión cerrada exitosamente');
    });
  });
});