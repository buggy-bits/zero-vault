import { EncryptedPrivateKey } from "./crypto";

/**
 * Vault Status States:
 * - 'unauthenticated': No valid session (no cookies/expired tokens)
 * - 'locked': Valid session but private key not in memory (needs password to unlock)
 * - 'unlocked': Valid session + private key in memory (full access)
 */
export type VaultStatus = 'unauthenticated' | 'locked' | 'unlocked';

export interface User {
  _id: string;
  email: string;
  publicKey: JsonWebKey | null;
  encryptedPrivateKey: EncryptedPrivateKey | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  publicKey: JsonWebKey | null;
  privateKey: CryptoKey | null;
  vaultStatus: VaultStatus;
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
