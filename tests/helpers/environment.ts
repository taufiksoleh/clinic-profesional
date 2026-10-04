export function requireTestEnvironment() {
  const database = new URL(process.env.DATABASE_URL || 'postgres://localhost/invalid')
  if (!process.env.CLINIC_TEST_RUN || !database.pathname.startsWith('/clinic_test_')) {
    throw new Error('Run integration tests through npm run test:integration or npm run verify.')
  }
  if (
    !process.env.TEST_BASE_URL ||
    process.env.TEST_BASE_URL !== process.env.NEXT_PUBLIC_SITE_URL
  ) {
    throw new Error('The test server URL must match the isolated test environment.')
  }
}
