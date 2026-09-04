import { Router, type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";

const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      passwordHash: req.body.passwordHash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    },
  });
});
