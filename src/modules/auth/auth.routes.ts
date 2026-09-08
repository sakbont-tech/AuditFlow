import { Router, type Request, type Response } from "express";
import { db } from "../../db/prismaDB.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import crypto from "crypto";
import { SignJWT } from "jose";
import { env } from "../../config/env.js";

const authRouter = Router();

type DriverAdapterErrorMeta = {
  cause?: {
    constraint?:
      | string
      | {
          index?: string;
        };
  };
};

function matchesUniqueConstraint(
  error: Prisma.PrismaClientKnownRequestError,
  fieldName: string,
  indexName: string,
): boolean {
  const target = error.meta?.target;
  if (
    (Array.isArray(target) && target.includes(fieldName)) ||
    (typeof target === "string" && target.includes(fieldName))
  ) {
    return true;
  }

  const adapterError = error.meta?.driverAdapterError as
    | DriverAdapterErrorMeta
    | undefined;
  const constraint = adapterError?.cause?.constraint;

  return (
    constraint === indexName ||
    (typeof constraint === "object" && constraint?.index === indexName)
  );
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must be at most 72 UTF-8 bytes",
    }),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must be at most 72 UTF-8 bytes",
    }),
});

const encodedJwtSecret = new TextEncoder().encode(env.jwtSecret);

async function createAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(encodedJwtSecret);
}

authRouter.post("/register", async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "INVALID_REGISTRATION_DATA",
        message: "Registration schema validation failed",
      },
    });
  }

  let attempts = 0;
  const maxAttempts = 3;
  const passwordHash = await hashPassword(result.data.password);
  while (attempts < maxAttempts) {
    try {
      const accountNumber = crypto
        .randomInt(100000000000, 999999999999)
        .toString();

      const [user, account] = await db.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: result.data.email,
            passwordHash,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
          },
        });

        const createdAccount = await tx.account.create({
          data: {
            accountNumber,
            ownerId: createdUser.id,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            accountId: createdAccount.id,
            amountCents: createdAccount.balanceCents,
          },
        });

        return [createdUser, createdAccount];
      });

      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
        },
        account: {
          accountId: account.id,
          accountNumber: account.accountNumber,
          balanceCents: account.balanceCents,
          createdAt: account.createdAt,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        if (
          error.meta?.modelName === "User" ||
          matchesUniqueConstraint(error, "email", "User_email_key")
        ) {
          return res.status(409).json({
            error: {
              code: "EMAIL_ALREADY_REGISTERED",
              message:
                "The email entered has already been used to register an account",
            },
          });
        }

        if (
          matchesUniqueConstraint(
            error,
            "accountNumber",
            "Account_accountNumber_key",
          )
        ) {
          attempts++;

          if (attempts >= maxAttempts) {
            throw error;
          }

          continue;
        }
      }

      throw error;
    }
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "INVALID_LOGIN_FORMAT",
        message: "Login schema validation failed",
      },
    });
  }

  try {
    const user = await db.user.findUnique({
      where: { email: result.data.email },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_LOGIN_DATA",
          message: "incorrect login credentials",
        },
      });
    }

    const isMatch = await bcrypt.compare(
      result.data.password,
      user.passwordHash,
    );

    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "INVALID_LOGIN_DATA",
          message: "incorrect login credentials",
        },
      });
    }

    return res.status(200).json({
      accessToken: await createAccessToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: unknown) {
    throw error;
  }
});

export default authRouter;
