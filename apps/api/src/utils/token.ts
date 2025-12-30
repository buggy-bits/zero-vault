import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
} from "../config/env";

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
