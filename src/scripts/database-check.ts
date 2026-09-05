import { db } from "../db/prismaDB.js";

try {
  const count = await db.user.count();
  console.log(count);
} finally {
  await db.$disconnect();
}
