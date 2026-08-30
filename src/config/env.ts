import dotenv from "dotenv";

dotenv.config();
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${port}`);
}

export const env = {
  port,
};
