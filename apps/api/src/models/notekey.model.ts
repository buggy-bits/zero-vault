import mongoose, { Types, Document } from "mongoose";

/**
 * Ephemeral EC public key (JWK format)
 */
export interface EphemeralPublicKeyJwk {
  crv: "P-256";
  ext: boolean;
  key_ops: string[];
  kty: "EC";
  x: string;
  y: string;
}

/**
 * NoteKey schema fields
 */
export interface NoteKeyFields {
  noteId: Types.ObjectId;
  userId: Types.ObjectId;

  encryptedDEK: string;
  dekIv: string;
  dekAlgo: "AES-256-GCM";

  ephemeralPublicKey: EphemeralPublicKeyJwk;

  grantedBy: Types.ObjectId;
  grantedAt: Date;

  isRevoked: boolean;
  revokedAt: Date | null;
}

/**
 * NoteKey instance methods
 */
export interface NoteKeyMethods {
  revoke(): Promise<NoteKeyDocument>;
}

/**
 * Full NoteKey document type
 */
export interface NoteKeyDocument
  extends NoteKeyFields,
    NoteKeyMethods,
    Document {}

const NoteKeySchema = new mongoose.Schema<NoteKeyDocument>(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    encryptedDEK: {
      type: String,
      required: true,
    },

    dekIv: {
      type: String,
      required: true,
    },

    dekAlgo: {
      type: String,
      enum: ["AES-256-GCM"],
      required: true,
      default: "AES-256-GCM",
    },

    ephemeralPublicKey: {
      type: mongoose.Schema.Types.Mixed, // JsonWebKey
      required: true,
    },

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    grantedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

NoteKeySchema.index({ noteId: 1, userId: 1 }, { unique: true });

NoteKeySchema.methods.revoke = function (this: NoteKeyDocument) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  return this.save();
};

export const NoteKey = mongoose.model<NoteKeyDocument>(
  "NoteKey",
  NoteKeySchema
);
