import { Router } from "express";
import { oauth2Client } from "../config/google";

import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";
import { GoogleDriveConnection } from "../models/connectToDrive.model";
import { encryptToken } from "../utils/token";

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
  // res.send({ message: "test" });

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

  // 3. Store in DB
  await GoogleDriveConnection.findOneAndUpdate(
    { userId: state },
    {
      refreshTokenEncrypted: encryptedRefreshToken,
      scope: "drive.file",
      connectedAt: new Date(),
    },
    { upsert: true }
  );

  // 4. Redirect back to frontend
  res.redirect("http://localhost:5173/settings?drive=connected");
});

export default router;
