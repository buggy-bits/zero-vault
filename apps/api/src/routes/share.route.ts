import { Router } from "express";

import { NoteKey } from "../models/notekey.model";
import {
  IAuthenticatedRequest,
  verifyToken,
} from "../middlewares/token.middleware";

const router = Router();

router.post("/", verifyToken, async (req: IAuthenticatedRequest, res) => {
  const { noteId, userId, encryptedDEK, dekIv, ephemeralPublicKey } = req.body;

  await NoteKey.create({
    noteId,
    userId,
    encryptedDEK,
    dekIv,
    ephemeralPublicKey,
  });

  res.status(201).json({ message: "Note shared" });
});

export default router;
