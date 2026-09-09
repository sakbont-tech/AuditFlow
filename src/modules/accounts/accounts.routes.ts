import { Router, type Request, type Response } from "express";
import { db } from "../../db/prismaDB.js";

const accountRouter = Router();

accountRouter.get("/", async (req: Request, res: Response) => {
  try {
    const accounts = await db.account.findMany({
      where: { ownerId: res.locals.userId },
    });

    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      accountNumber:
        "*".repeat(Math.max(0, account.accountNumber.length - 4)) +
        account.accountNumber.slice(-4),
      balanceCents: account.balanceCents,
      createdAt: account.createdAt,
    }));

    return res.status(200).json({
      accounts: formattedAccounts,
    });
  } catch (error) {
    throw error;
  }
});

export default accountRouter;
