import { Schema, model, Document } from "mongoose";

interface EncryptedPrivateKey {
  ciphertext: string;
  iv: string;
  salt: string;
}

export interface UserType extends Document {
  email: string;
  passwordHash: string;
  publicKey: JsonWebKey;
  encryptedPrivateKey: EncryptedPrivateKey;
}

const EncryptedPrivateKeySchema = new Schema<EncryptedPrivateKey>(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<UserType>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    publicKey: {
      type: Schema.Types.Mixed, // JsonWebKey is an object with varying structure
      required: true,
    },
    encryptedPrivateKey: {
      type: EncryptedPrivateKeySchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model<UserType>("User", UserSchema);
export default UserModel;
