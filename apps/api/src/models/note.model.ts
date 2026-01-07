import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },

    storage: {
      type: String,
      enum: ["mongo", "google-drive"],
      required: true,
    },
    // either encryptedContent or driveFileId must be set
    // ---- TEXT NOTES ----
    encryptedContent: {
      type: String,
      default: null,
    },

    // ---- FILE NOTES ----
    driveFileId: {
      type: String,
      default: null,
    },

    // ---- CRYPTO METADATA ----
    iv: {
      type: String,
      required: true,
    },

    contentAlgo: {
      type: String,
      enum: ["AES-256-GCM"],
      required: true,
      default: "AES-256-GCM",
    },

    mimeType: {
      type: String,
      default: null,
    },

    originalFileName: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      default: null,
    },

    // ---- SOFT DELETE ----
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NoteSchema.pre("validate", function (next) {
  const hasEncryptedContent = !!this.encryptedContent;
  const hasDriveFileId = !!this.driveFileId;

  if (hasEncryptedContent === hasDriveFileId) {
    return next(
      new Error("Exactly one of encryptedContent or driveFileId must be set.")
    );
  }

  if (this.type === "text" && !hasEncryptedContent) {
    return next(new Error("Text notes require encryptedContent."));
  }

  if (this.type === "file" && !hasDriveFileId) {
    return next(new Error("File notes require driveFileId."));
  }

  next();
});

NoteSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const Note = mongoose.model("Note", NoteSchema);
