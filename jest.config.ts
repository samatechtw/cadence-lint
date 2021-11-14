export = {
  testMatch: ['**/test/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.ts'],
}
