import { Response } from 'express';

type SuccessPayload<T> = {
  success: true;
  data: T;
  message?: string;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const payload: SuccessPayload<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(payload);
};
