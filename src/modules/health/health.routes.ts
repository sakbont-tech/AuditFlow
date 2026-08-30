import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req: Request, res: Response) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`,
  );
  res.status(200).json({ status: "ok" });
});

export default healthRouter;
