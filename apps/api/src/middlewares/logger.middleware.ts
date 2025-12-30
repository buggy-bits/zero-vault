// src/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * A simple logging middleware that logs request details to the console.
 * It logs the HTTP method, the original URL, and a timestamp.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next function to pass control to the next middleware.
 */
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log the HTTP method, the original URL, and the current timestamp
  console.log(`${req.method} - ${req.originalUrl}`);

  // Call the next middleware in the stack
  next();
};

export default loggerMiddleware;
