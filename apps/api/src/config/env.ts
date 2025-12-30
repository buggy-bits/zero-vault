import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  PORT,
  NODE_ENV,
  DB_URI,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_SECRET,
  GUEST_USER_EMAIL,
} = process.env;
