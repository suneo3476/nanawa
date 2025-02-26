import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // テスト環境のNext.jsアプリのパスを指定
  dir: './',
})

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    // エイリアスの設定
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
