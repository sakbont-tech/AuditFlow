import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

const notFound = (req: Request, res: Response) => {
  res.status(404).json({ err: "Route not found" });
};

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500).json({ err: "Interal Server Error" });
};

app.get("/api/health", (req: Request, res: Response) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`,
  );
  res.status(200).json({ status: "ok" });
});

app.get("/api/error", (req: Request, res: Response) => {
  throw new Error("Error");
});

app.use(notFound);
app.use(errorHandler);

export default app;
