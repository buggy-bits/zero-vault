import { Router } from "express";
import { IAuthenticatedRequest } from "../middlewares/token.middleware";
import { Note } from "../models/note.model";

import { GoogleDriveConnection } from "../models/connectToDrive.model";
import { getDriveClient } from "../utils/getDriveClient";
import { NoteKey } from "../models/notekey.model";
import { upload } from "../config/multer";
import { Readable } from "stream";
import { FileShare } from "../models/fileShare.model";
const router = Router();
//  /files
router.post(
  "/upload",
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
        name: req.body.originalFileName + ".enc",
        parents: [driveConn.rootFolderId!],
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

router.get("/download/:noteId", async (req: IAuthenticatedRequest, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note || note.storage !== "google-drive") {
    return res.sendStatus(404);
  }

  // Explicit ownership check
  if (note.ownerId.toString() !== req.user!.userId) {
     return res.sendStatus(403);
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
});

router.delete("/:noteId", async (req: IAuthenticatedRequest, res) => {
  const { noteId } = req.params;

  // 1. find note
  const note = await Note.findById(noteId);
  if (!note || note.type !== "file") {
    return res.sendStatus(404);
  }

  // 2. verify owner
  if (note.ownerId.toString() !== req.user!.userId) {
    return res.sendStatus(403);
  }

  // 3. delete from Google Drive
  const driveConn = await GoogleDriveConnection.findOne({
    userId: note.ownerId,
    isActive: true,
  });

  if (!driveConn) {
    return res.status(500).json({ error: "Drive not connected" });
  }

  const drive = await getDriveClient(driveConn.refreshTokenEncrypted);

  await drive.files.delete({
    fileId: note.driveFileId!,
  });

  // 4. delete crypto + sharing data
  await NoteKey.deleteMany({ noteId });
  await FileShare.deleteMany({ noteId });

  // 5. delete note
  await Note.deleteOne({ _id: noteId });

  res.json({ success: true });
});

export default router;
