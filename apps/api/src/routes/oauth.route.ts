import { Router } from "express";
import { oauth2Client } from "../config/google";

import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";
import { GoogleDriveConnection } from "../models/connectToDrive.model";
import { encryptToken } from "../utils/token";
import { getDriveClient } from "../utils/getDriveClient";
import { getOrCreateZeroVaultFolder } from "../utils/getOrCreateFolder";
import { FRONTEND_URL } from "../config/env";

const router = Router();

router.get("/google/start", verifyToken, (req: IAuthenticatedRequest, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // IMPORTANT (refresh token)
    prompt: "consent", // IMPORTANT (force refresh token)
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: req.user!.userId, // CSRF protection
  });

  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Invalid OAuth response");
  }

  // 1. Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code as string);

  if (!tokens.refresh_token) {
    return res.status(400).send("No refresh token received");
  }

  // 2. Encrypt refresh token (VERY IMPORTANT)
  const encryptedRefreshToken = encryptToken(tokens.refresh_token);

  // after saving encrypted refresh token
  const drive = await getDriveClient(encryptedRefreshToken);

  // create or find ZeroVault folder
  const rootFolderId = await getOrCreateZeroVaultFolder(drive);

  // store folderId in DB
  await GoogleDriveConnection.findOneAndUpdate(
    { userId: state },
    {
      refreshTokenEncrypted: encryptedRefreshToken,
      rootFolderId,
      scope: "drive.file",
      connectedAt: new Date(),
    },
    { upsert: true }
  );

  // 4. Redirect back to frontend
  const redirectUrl = FRONTEND_URL 
    ? `${FRONTEND_URL}/settings?drive=connected` 
    : "http://localhost:5173/settings?drive=connected";
    
  res.redirect(redirectUrl);
});

router.get("/google/status", verifyToken, async (req: IAuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const connection = await GoogleDriveConnection.findOne({ userId, isActive: true });

    if (connection) {
      return res.json({ isConnected: true, connectedAt: connection.connectedAt });
    } else {
      return res.json({ isConnected: false });
    }
  } catch (error) {
    return res.status(500).json({ isConnected: false, error: "Failed to check status" });
  }
});

export default router;
