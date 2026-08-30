import express, {
  type Express,
} from "express";

import errorHandler from "./middleware/error-handler.js";
import notFoundHandler from "./middleware/not-found.js";
import healthRouter from "./modules/health/health.routes.js";

const app: Express = express();

app.use("/api/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
