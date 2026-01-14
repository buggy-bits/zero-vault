import { Router } from "express";

import { NoteKey } from "../models/notekey.model";
import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";
import { Note } from "../models/note.model";
import UserModel from "../models/user.model";
import { FileShare } from "../models/fileShare.model";
import { FRONTEND_URL } from "../config/env";
import { GoogleDriveConnection } from "../models/connectToDrive.model";
import { getDriveClient } from "../utils/getDriveClient";

const router = Router();
/**
 * Share note with another user
 */
router.post("/note", verifyToken, async (req: IAuthenticatedRequest, res) => {
  const {
    noteId,
    receiverEmail,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
  } = req.body;

  const receiver = await UserModel.findOne({ email: receiverEmail });
  if (!receiver) return res.sendStatus(404);

  await NoteKey.findOneAndUpdate(
    { noteId, userId: receiver._id },
    {
      encryptedDEK,
      dekIv,
      ephemeralPublicKey,
      grantedBy: req.user!.userId,
      grantedAt: new Date(),
      isRevoked: false,
      revokedAt: null,
    },
    { upsert: true }
  );

  const shareId = crypto.randomUUID();

  await FileShare.create({
    shareId,
    noteId,
    receiverEmail,
    createdBy: req.user!.userId,
  });

  res.json({
    shareLink: `${FRONTEND_URL}/share/note/${shareId}`,
  });
});

/**
 * Share file with another user
 */
//     /share
router.post("/file", verifyToken, async (req: IAuthenticatedRequest, res) => {
  const {
    noteId,
    receiverEmail,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
  } = req.body;

  // 1. Validate note
  const note = await Note.findById(noteId);
  if (!note || note.type !== "file") {
    return res.status(404).json({ error: "File not found" });
  }

  // 2. Validate receiver
  const receiver = await UserModel.findOne({ email: receiverEmail });
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  // 3. Create or replace NoteKey for receiver
  await NoteKey.findOneAndUpdate(
    { noteId, userId: receiver._id },
    {
      encryptedDEK,
      dekIv,
      dekAlgo: "AES-256-GCM",
      ephemeralPublicKey,
      grantedBy: req.user!.userId,
      grantedAt: new Date(),
      isRevoked: false,
      revokedAt: null,
    },
    { upsert: true }
  );
  console.log("here");
  // 4. Create share link
  const shareId = crypto.randomUUID();

  await FileShare.create({
    shareId,
    noteId,
    receiverEmail,
    createdBy: req.user!.userId,
  });

  res.json({
    shareLink: `${FRONTEND_URL}/share/${shareId}`,
  });
});

/**
 * Download shared file
 */
router.get(
  "/download/:shareId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const { shareId } = req.params;

    const share = await FileShare.findOne({ shareId });
    if (!share) return res.sendStatus(404);

    // receiver email must match
    if (share.receiverEmail !== req.user!.email) {
      return res.sendStatus(403);
    }

    const note = await Note.findById(share.noteId);
    if (!note || note.type !== "file") {
      return res.sendStatus(404);
    }

    // get sender Drive connection
    const driveConn = await GoogleDriveConnection.findOne({
      userId: note.ownerId,
      isActive: true,
    });

    const drive = await getDriveClient(driveConn!.refreshTokenEncrypted);

    const driveRes = await drive.files.get(
      { fileId: note.driveFileId!, alt: "media" },
      { responseType: "arraybuffer" }
    );

    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(driveRes.data as ArrayBuffer));
  }
);

export default router;
