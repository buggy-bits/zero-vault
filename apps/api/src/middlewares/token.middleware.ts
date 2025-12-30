import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.middleware";
import { JWT_ACCESS_TOKEN_SECRET } from "../config/env";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../utils/token";

export interface IAuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const verifyToken = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string") {
      const error: AppError = new Error("Authorization header missing");
      error.status = 401;
      throw error;
    }
    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      const error: AppError = new Error("Token missing");
      error.status = 401;
      throw error;
    }
    jwt.verify(token, JWT_ACCESS_TOKEN_SECRET || "i-am-key", (err, decoded) => {
      if (err) {
        const error: AppError = new Error("Invalid or expired token");
        error.status = 401;
        return next(error);
      }

      // Attach user info to request object
      req.user = { userId: (decoded as TokenPayload).userId };
      next();
    });
  } catch (error) {
    return next(error);
  }
};
