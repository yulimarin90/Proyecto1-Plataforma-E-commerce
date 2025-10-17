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
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/Users/__tests__/setup.ts'],
  testTimeout: 10000
  
};
