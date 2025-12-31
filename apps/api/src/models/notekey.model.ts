import mongoose from "mongoose";

const NoteKeySchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  encryptedDEK: {
    type: String,
    required: true,
  },
  dekIv: {
    type: String,
    required: true,
  },
  ephemeralPublicKey: {
    type: Object,
    required: true,
  },
});

export const NoteKey = mongoose.model("NoteKey", NoteKeySchema);
