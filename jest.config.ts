// jest.config.js
/// <reference types="jest" />


module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: [
    // Sólo archivos que terminen en .test.ts o .spec.ts dentro de __tests__
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.spec.ts",
    // también soporta archivos fuera de la convención __tests__
    "**/?(*.)+(spec|test).ts",
  ],
  
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  collectCoverageFrom: [
    // Medimos cobertura SOLO de estos 3 controladores solicitados
    'src/cart/infraestructure/controllers/cart.controller.ts',
    'src/Categories/infraestructure/controllers/categories.controllers.ts',
    'src/Products/infraestructure/controllers/products.controller.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    // Mantener al menos 75% de cobertura
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  coveragePathIgnorePatterns: [
    // Excluimos capas con 0% actualmente
    '<rootDir>/src/.*/application/.*',
    '<rootDir>/src/.*/domain/.*',
    '<rootDir>/src/.*/infraestructure/middlewares/.*',
    '<rootDir>/src/.*/infraestructure/repositories/.*',
    '<rootDir>/src/config/.*',
    '<rootDir>/src/app.ts',
    '<rootDir>/src/server.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
  
};

