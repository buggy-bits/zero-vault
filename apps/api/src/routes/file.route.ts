import { Router } from "express";
import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";
import { Note } from "../models/note.model";

import { GoogleDriveConnection } from "../models/connectToDrive.model";
import { getDriveClient } from "../utils/getDriveClient";
import { NoteKey } from "../models/notekey.model";
import { upload } from "../config/multer";
import { Readable } from "stream";
const router = Router();

router.post(
  "/upload",
  verifyToken,
  upload.single("encryptedFile"),
  async (req: IAuthenticatedRequest, res) => {
    const driveConn = await GoogleDriveConnection.findOne({
      userId: req.user!.userId,
      isActive: true,
    });

    if (!driveConn) {
      return res.status(400).json({ message: "Drive not connected" });
    }

    const drive = await getDriveClient(driveConn.refreshTokenEncrypted);

    const bufferStream = Readable.from(req.file!.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: "zerVault/" + req.body.originalFileName + ".enc",
        mimeType: "application/octet-stream",
      },
      media: {
        mimeType: "application/octet-stream",
        body: bufferStream,
      },
    });
    const driveFileId = response.data.id!;

    // 2. Store metadata in DB
    const note = await Note.create({
      ownerId: req.user!.userId,
      type: "file",
      storage: "google-drive",
      driveFileId,
      iv: req.body.iv,
      mimeType: req.body.mimeType,
      originalFileName: req.body.originalFileName,
    });

    await NoteKey.create({
      noteId: note._id,
      userId: req.user!.userId,
      encryptedDEK: req.body.encryptedDEK,
      dekIv: req.body.dekIv,
      ephemeralPublicKey: req.body.ephemeralPublicKey,
      grantedBy: req.user!.userId,
      grantedAt: new Date(),
    });

    res.json({ success: true });
  }
);

router.get(
  "/download/:noteId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.storage !== "google-drive") {
      return res.sendStatus(404);
    }

    const driveConn = await GoogleDriveConnection.findOne({
      userId: req.user!.userId,
      isActive: true,
    });

    const drive = await getDriveClient(driveConn!.refreshTokenEncrypted);

    const response = await drive.files.get(
      { fileId: note.driveFileId!, alt: "media" },
      { responseType: "arraybuffer" }
    );

    res.setHeader("Content-Type", "application/octet-stream");

    res.send(Buffer.from(response.data as ArrayBuffer));
  }
);

export default router;
