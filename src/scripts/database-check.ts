import { prisma } from "../db/prisma.js";

try {
  const count = await prisma.user.count();
  console.log(count);
} finally {
  await prisma.$disconnect();
}
