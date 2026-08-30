import { type Request, type Response, type NextFunction } from "express";

const errorHandler = (
  _err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(500).json({ err: "Internal Server Error" });
};

export default errorHandler;
