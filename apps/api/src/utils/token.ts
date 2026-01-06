import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_SECRET,
} from "../config/env";
import { createHash, randomBytes, createCipheriv } from "crypto";

export interface TokenPayload {
  userId: string;
}

// Facade pattern is giving some conflicts with expiresIn option type, so i choose to break DRY
export const generateAccessToken = (data: TokenPayload): string => {
  return jwt.sign(data, JWT_ACCESS_TOKEN_SECRET || "i-am-key", {
    expiresIn: "1h",
  });
};

export const generateRefreshToken = (data: TokenPayload): string => {
  return jwt.sign(data, JWT_REFRESH_TOKEN_SECRET || "i-am-key", {
    expiresIn: "7d",
  });
};

const KEY = createHash("sha256").update(JWT_SECRET!).digest();

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);

  let encrypted = cipher.update(token, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return JSON.stringify({
    iv: iv.toString("base64"),
    data: encrypted,
    tag,
  });
}
