import "dotenv-expand/config";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const jwtSecret = process.env.JWT_SECRET;

const databaseUrl = process.env.DATABASE_URL;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${port}`);
}

if (!databaseUrl) {
  throw new Error("Database URL is required");
}

if (!jwtSecret || Buffer.byteLength(jwtSecret, "utf8") < 32) {
  throw new Error("JWT_SECRET must be at least 32 bytes");
}

export const env = {
  port,
  databaseUrl,
  jwtSecret,
};
