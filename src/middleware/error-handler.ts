import { type Request, type Response, type NextFunction } from "express";

const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err,
    },
  });
};

export default errorHandler;
