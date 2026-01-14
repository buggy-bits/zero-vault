import { Router } from "express";
import { Note } from "../models/note.model";
import { NoteKey } from "../models/notekey.model";
import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";
import { FileShare } from "../models/fileShare.model";

const router = Router();

/**
 * Create a new encrypted note (owner only)
 */
router.post("/", verifyToken, async (req: IAuthenticatedRequest, res) => {
  const {
    encryptedContent,
    iv,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
  } = req.body;

  if (!req.user?.userId) return res.sendStatus(401);

  // 1. Store encrypted note
  const note = await Note.create({
    ownerId: req.user!.userId,
    type: "text",
    storage: "mongo",
    encryptedContent,
    iv,
    mimeType: "text/plain",
  });

  // 2. Store DEK access for owner
  await NoteKey.create({
    noteId: note._id,
    userId: req.user!.userId,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
    grantedBy: req.user!.userId,
  });

  res.status(201).json({ noteId: note._id });
});

/**
 * Get all notes accessible by logged-in user
 */
router.get("/", verifyToken, async (req: IAuthenticatedRequest, res) => {
  if (!req.user?.userId) return res.sendStatus(401);

  // 1. Get all active keys for this user
  const noteKeys = await NoteKey.find({
    userId: req.user.userId,
    isRevoked: false,
  });

  if (noteKeys.length === 0) {
    return res.json([]);
  }

  // 2. Extract noteIds
  const noteIds = noteKeys.map((nk) => nk.noteId);

  // 3. Fetch notes user has access to
  const notes = await Note.find({
    _id: { $in: noteIds },
    isDeleted: false,
    type: "text",
  }).sort({ createdAt: -1 });

  // 4. Build lookup map for keys
  const keyMap = new Map(noteKeys.map((nk) => [nk.noteId.toString(), nk]));

  // 5. Merge note + key
  const response = notes.map((note) => {
    const key = keyMap.get(note._id.toString());

    return {
      noteId: note._id,
      encryptedContent: note.encryptedContent,
      iv: note.iv,

      encryptedDEK: key!.encryptedDEK,
      dekIv: key!.dekIv,
      ephemeralPublicKey: key!.ephemeralPublicKey,

      ownerId: note.ownerId,
      createdAt: note.createdAt,
    };
  });

  res.json(response);
});

/**
 * GET /api/notes/files
 * Returns encrypted file notes accessible by the user
 */
router.get("/files", verifyToken, async (req: IAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 1️⃣ Find all note_keys for this user
    const noteKeys = await NoteKey.find({
      userId,
      isRevoked: { $ne: true },
    }).lean();

    if (!noteKeys.length) {
      return res.json([]);
    }

    const noteIds = noteKeys.map((nk) => nk.noteId);

    // 2️⃣ Fetch corresponding notes (FILES ONLY)
    const notes = await Note.find({
      _id: { $in: noteIds },
      type: "file",
      isDeleted: { $ne: true },
    }).lean();

    // 3️⃣ Merge note + key data
    const response = notes.map((note) => {
      const key = noteKeys.find(
        (nk) => nk.noteId.toString() === note._id.toString()
      );

      return {
        _id: note._id,

        // File metadata
        originalFileName: note.originalFileName,
        mimeType: note.mimeType,
        fileSize: note.fileSize,
        iv: note.iv,

        // Encrypted DEK info (needed for decryption)
        encryptedDEK: key!.encryptedDEK,
        dekIv: key!.dekIv,
        ephemeralPublicKey: key!.ephemeralPublicKey,

        // Storage info
        storage: note.storage,
        driveFileId: note.driveFileId,

        createdAt: note.createdAt,
      };
    });

    res.json(response);
  } catch (err) {
    console.error("GET /api/notes/files error:", err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

router.get(
  "/metadata/share/:shareId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const share = await FileShare.findOne({ shareId: req.params.shareId });

    if (!share) {
      return res.status(403).json({ error: "no share" });
    }
    if (share.receiverEmail !== req.user!.email) {
      return res.status(403).json({ error: "no match email" });
    }

    const note = await Note.findById(share.noteId);

    if (!note || note.isDeleted) {
      return res.sendStatus(404);
    }

    const key = await NoteKey.findOne({
      noteId: note!._id,
      userId: req.user!.userId,
      isRevoked: false,
    });

    res.json({
      encryptedDEK: key!.encryptedDEK,
      dekIv: key!.dekIv,
      ephemeralPublicKey: key!.ephemeralPublicKey,
      iv: note!.iv,
      mimeType: note!.mimeType,
      originalFileName: note!.originalFileName,
    });
  }
);

router.get(
  "/metadata/notes/share/:shareId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const share = await FileShare.findOne({
      shareId: req.params.shareId,
    });

    if (!share || share.receiverEmail !== req.user!.email) {
      return res.sendStatus(403);
    }

    const note = await Note.findById(share.noteId);
    const key = await NoteKey.findOne({
      noteId: share.noteId,
      userId: req.user!.userId,
      isRevoked: false,
    });

    res.json({
      encryptedContent: note!.encryptedContent,
      iv: note!.iv,
      encryptedDEK: key!.encryptedDEK,
      dekIv: key!.dekIv,
      ephemeralPublicKey: key!.ephemeralPublicKey,
    });
  }
);
/**
 * Sender metadata (by fileId / noteId)
 * Used when sharing
 */
router.get(
  "/metadata/file/:fileId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const { fileId } = req.params;

    const note = await Note.findById(fileId);
    if (!note) return res.sendStatus(404);

    if (note.isDeleted) {
      return res.sendStatus(404);
    }

    // only owner can request this
    if (note.ownerId.toString() !== req.user!.userId) {
      return res.sendStatus(403);
    }

    const key = await NoteKey.findOne({
      noteId: fileId,
      userId: req.user!.userId,
      isRevoked: false,
    });

    if (!key) return res.sendStatus(404);

    res.json({
      encryptedDEK: key.encryptedDEK,
      dekIv: key.dekIv,
      ephemeralPublicKey: key.ephemeralPublicKey,
    });
  }
);

/**
 * Soft delete a text note + revoke all keys
 */
router.delete(
  "/:noteId",
  verifyToken,
  async (req: IAuthenticatedRequest, res) => {
    const { noteId } = req.params;

    const note = await Note.findById(noteId);
    if (!note || note.type !== "text") {
      return res.sendStatus(404);
    }

    // owner only
    if (note.ownerId.toString() !== req.user!.userId) {
      return res.sendStatus(403);
    }

    // 1. soft delete note
    note.isDeleted = true;
    note.deletedAt = new Date();
    await note.save();

    // 2. revoke all keys (owner + receivers)
    await NoteKey.updateMany(
      { noteId },
      { isRevoked: true, revokedAt: new Date() }
    );

    // 3. invalidate share links
    await FileShare.deleteMany({ noteId });

    res.json({ success: true });
  }
);
export default router;
