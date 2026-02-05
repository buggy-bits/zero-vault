// config/cookies.ts
import { CookieOptions } from "express";
import { NODE_ENV, TOKEN_REFRESH_PATH } from "./env";
const isProduction = NODE_ENV === "production";
export const accessCookie: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshCookie: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: TOKEN_REFRESH_PATH || "/api/v1/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
