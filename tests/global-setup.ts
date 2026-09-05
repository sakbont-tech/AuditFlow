import { execSync } from "node:child_process";
import type { TestProject } from "vitest/node";

export default function setup(project: TestProject) {
  const databaseUrl = project.config.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Global setup requires the validated test DATABASE_URL.");
  }

  // Use the same validated URL as the workers; a failed migration aborts Vitest.
  execSync("npx prisma migrate deploy", {
    cwd: project.config.root,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });
}
