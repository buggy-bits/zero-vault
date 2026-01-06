import mongoose from "mongoose";

const GoogleDriveConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  refreshTokenEncrypted: {
    type: String,
    required: true,
  },

  scope: {
    type: String,
    required: true,
  },

  connectedAt: {
    type: Date,
    default: Date.now,
  },

  lastUsedAt: {
    type: Date,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

export const GoogleDriveConnection = mongoose.model(
  "GoogleDriveConnection",
  GoogleDriveConnectionSchema
);
