import express from "express";
import allRoutes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import corsMiddleware from "./config/cors";
import loggerMiddleware from "./middlewares/logger.middleware";
import cookieParser from "cookie-parser";

const app = express();
app.use(corsMiddleware);
app.options("*", corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(loggerMiddleware);
// Routes
app.use("/api/v1", allRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
