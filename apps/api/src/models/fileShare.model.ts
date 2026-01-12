import mongoose from "mongoose";

const FileShareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    unique: true,
    required: true,
  },

  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
  },

  receiverEmail: {
    type: String,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const FileShare = mongoose.model("FileShare", FileShareSchema);
