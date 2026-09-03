import "dotenv-expand/config";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

const databaseUrl = process.env.DATABASE_URL;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${port}`);
}

if (!databaseUrl) {
  throw new Error("Database URL is required");
}

export const env = {
  port,
  databaseUrl,
};
