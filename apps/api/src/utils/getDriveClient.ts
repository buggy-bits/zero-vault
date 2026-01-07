import { google } from "googleapis";
import { oauth2Client } from "../config/google";
import { decryptToken } from "./token";

export async function getDriveClient(encryptedRefreshToken: string) {
  const refreshToken = decryptToken(encryptedRefreshToken);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
}
