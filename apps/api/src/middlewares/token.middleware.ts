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
    let token: string | undefined;

    // Read Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      const error: AppError = new Error("Authentication token missing");
      error.status = 401;
      throw error;
    }

    jwt.verify(token, JWT_ACCESS_TOKEN_SECRET || "i-am-key", (err, decoded) => {
      if (err) {
        const error: AppError = new Error("Invalid or expired token");
        error.status = 401;
        return next(error);
      }

      req.user = { userId: (decoded as TokenPayload).userId };
      next();
    });
  } catch (error) {
    next(error);
  }
};
