module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: [
        '**/__tests__/node/**/*.+(ts|tsx|js)',
      ],
      transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      testMatch: [
        '**/__tests__/jsdom/**/*.+(ts|tsx|js)',
      ],
      transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    }
  ],
  verbose: true,
  // カバレッジの設定
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx,js}',
    // テストコードを除外
    '!**/__tests__/**',
    // 設定ファイルを除外
    '!**/.*',
    // 外部モジュールを除外
    '!**/node_modules/**',
  ],
  coverageReporters: ['text'],
};
