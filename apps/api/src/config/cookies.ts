// config/cookies.ts
import { CookieOptions } from "express";
import { NODE_ENV } from "./env";
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
  path: "/api/v1/auth/token/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
