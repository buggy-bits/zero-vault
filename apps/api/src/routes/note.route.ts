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

export default router;
