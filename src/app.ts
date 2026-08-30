import express, { type Express, type Request, type Response } from "express";

import errorHandler from "./middleware/error-handler.js";
import notFoundHandler from "./middleware/not-found.js";
import healthRouter from "./modules/health/health.routes.js";

const app: Express = express();

app.use("/api/health", healthRouter);

app.get("/api/error", (req: Request, res: Response) => {
  throw new Error("Error");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
