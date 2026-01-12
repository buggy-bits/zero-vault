import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  PORT,
  NODE_ENV,
  DB_URI,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_SECRET,
  GUEST_USER_EMAIL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_SECRET,
  FRONTEND_URL,
} = process.env;

console.dir(process.env);
