import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../utils/responseHandler';

export const greetByName = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    sendSuccess(res, {}, `GOOD TO SEE YOU BRO`, 200);
  } catch (error) {
    next(error);
  }
};
