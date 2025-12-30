import { NextFunction, Response } from 'express';
import { IAuthenticatedRequest } from '../middlewares/token.middleware';
import { AppError } from '../middlewares/errorHandler.middleware';
import UserModel from '../models/user.model';
import { sendSuccess } from '../utils/responseHandler';

export const getSinglUser = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.userId;

    if (!userId) {
      const error: AppError = new Error('No user authentication.');
      error.status = 400;
      throw error;
    }
    const existingUser = await UserModel.findOne({ _id: userId }).select(
      'id userName email createdAt'
    );

    if (!existingUser) {
      const error: AppError = new Error('No User found.');
      error.status = 404;
      throw error;
    }
    const respData = { user: existingUser };

    sendSuccess(res, respData, 'User found', 200);
  } catch (error) {
    next(error);
  }
};
