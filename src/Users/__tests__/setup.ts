// Mock de console methods para evitar ruido en las pruebas
global.console = {
  ...console,
  
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' }); // o '.env.test' si tienes uno aparte

// Verificación opcional
console.log('JWT_SECRET cargado:', process.env.JWT_SECRET);


// Configuración de timeouts por defecto
jest.setTimeout(10000);

// Mock de crypto para tokens
// Preserve actual crypto implementation but mock randomBytes to keep deterministic tokens
jest.mock('crypto', () => {
  const realCrypto = jest.requireActual('crypto');
  return {
    ...realCrypto,
    randomBytes: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-token-123')
    })
  };
});

// Mock de multer para uploads
jest.mock('multer', () => ({
  default: jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = { path: 'mock-image-path.jpg' };
      next();
    })
  }))
}));

// Mock de Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn()
  }))
}));