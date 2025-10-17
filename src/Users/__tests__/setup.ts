// src/__tests__/setup.ts
// Configuración global para las pruebas

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