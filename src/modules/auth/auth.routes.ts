import { Router, type Request, type Response } from "express";
import { db } from "../../db/prismaDB.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { error } from "node:console";

const authRouter = Router();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    result.error;
    return res
      .status(400)
      .json({ err: "registration schema validation failed" });
  }


  try {
    const user = await db.user.create({
      data: {
        email: result.data.email,
        passwordHash: await hashPassword(result.data.password),
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error as { code?: string }).code === "P2002"
    ) {
      return res.status(409).json({
        msg: "The email entered has already been used to register an account",
      });
    }

    throw error;
  }
});

export default authRouter;
