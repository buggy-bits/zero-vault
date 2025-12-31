import { EncryptedPrivateKey } from "./crypto";

export interface User {
  _id: string;
  // userName: string;
  email: string;
  publicKey: JsonWebKey | null;
  // encryptedPrivateKey: EncryptedPrivateKey | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  publicKey: JsonWebKey | null;
  privateKey: CryptoKey | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  // userName: string;
  email: string;
  password: string;
  publicKey: JsonWebKey;
  encryptedPrivateKey: EncryptedPrivateKey;
}
