import { Router } from "express";
import { Note } from "../models/note.model";
import { NoteKey } from "../models/notekey.model";
import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";

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
    ownerId: req.user.userId,
    encryptedContent,
    iv,
  });

  // 2. Store DEK access for owner
  await NoteKey.create({
    noteId: note._id,
    userId: req.user.userId,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
  });

  res.status(201).json({ noteId: note._id });
});

/**
 * Get all notes accessible by logged-in user
 */
router.get("/", verifyToken, async (req: IAuthenticatedRequest, res) => {
  if (!req.user?.userId) return res.sendStatus(401);

  // 1. Get all DEKs for this user
  const noteKeys = await NoteKey.find({ userId: req.user.userId });

  // 2. Get note IDs
  const noteIds = noteKeys.map((nk) => nk.noteId);

  // 3. Fetch notes
  const notes = await Note.find({ _id: { $in: noteIds } });

  // 4. Merge note + key
  const response = notes.map((note) => {
    const key = noteKeys.find(
      (nk) => nk.noteId.toString() === note._id.toString()
    );

    return {
      noteId: note._id,
      encryptedContent: note.encryptedContent,
      iv: note.iv,
      encryptedDEK: key?.encryptedDEK,
      dekIv: key?.dekIv,
      ephemeralPublicKey: key?.ephemeralPublicKey,
      createdAt: note.createdAt,
    };
  });

  res.json(response);
});

export default router;
