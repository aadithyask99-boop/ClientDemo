import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // With TEST_DATABASE_URL the database tests share one server and drop their tables between tests, so the files
    // must not overlap. Without it each test has its own in-process database and files can run in parallel.
    fileParallelism: !process.env.TEST_DATABASE_URL,
  },
});
