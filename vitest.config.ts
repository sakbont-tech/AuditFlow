import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "vitest/config";

const loaded = dotenv.config({
  path: ".env.test",
  override: true,
});

if (loaded.error) {
  throw new Error("Unable to load .env.test.", { cause: loaded.error });
}

if (!loaded.parsed?.DATABASE_URL) {
  throw new Error("DATABASE_URL must be defined in .env.test.");
}

// Resolve references using only .env.test, without inheriting shell values.
const expanded = expand({ parsed: { ...loaded.parsed }, processEnv: {} });
const databaseUrl = expanded.parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL in .env.test must expand to a nonempty URL.");
}

let url: URL;
try {
  url = new URL(databaseUrl);
} catch {
  // Do not include the connection string, which contains credentials.
  throw new Error("DATABASE_URL in .env.test must be a valid PostgreSQL URL.");
}

if (
  !["postgres:", "postgresql:"].includes(url.protocol) ||
  url.hostname !== "localhost" ||
  url.port !== "5433" ||
  url.pathname !== "/auditflow_test" ||
  // node-postgres permits query parameters to override the URL destination.
  url.searchParams.has("host") ||
  url.searchParams.has("port")
) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL must target localhost:5433/auditflow_test without host or port query overrides.",
  );
}

process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  test: {
    globalSetup: "./tests/global-setup.ts",
    fileParallelism: false,
    env: {
      DATABASE_URL: databaseUrl,
    },
  },
});
