import express, { type Express } from "express";

import errorHandler from "./middleware/error-handler.js";
import notFoundHandler from "./middleware/not-found.js";
import healthRouter from "./modules/health/health.routes.js";
import authRouter from "./modules/auth/auth.routes.js";

const app: Express = express();

app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
