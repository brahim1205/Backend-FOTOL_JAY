module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!uuid|cloudinary|@prisma/)',
  ],
  moduleNameMapper: {
    '^uuid$': 'uuid',
    '^@prisma/client$': '@prisma/client',
    '^cloudinary$': 'cloudinary',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRunner: 'jest-circus',
};