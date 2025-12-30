import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack); // console log stack trace for debugging
    console.log("Error handler middleware called");
  }
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};
