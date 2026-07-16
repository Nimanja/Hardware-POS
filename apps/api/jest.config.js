/**
 * Jest config for the API. Unit specs are co-located as `*.spec.ts` next to the
 * unit under test and mock all I/O (Prisma / HTTP / QuickBooks). Integration
 * specs (a real disposable Postgres + a QuickBooks stub) are a separate future
 * project — see docs/testing/integration-test-plan.md.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
};
