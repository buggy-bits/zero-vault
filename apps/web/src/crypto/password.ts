// src/crypto/password.ts

import {
  stringToBuffer,
  bufferToString,
  bufferToBase64,
  base64ToBuffer,
} from "./utils";

const ITERATIONS = 150000;

async function deriveKey(password: string, salt: Uint8Array) {
  const passwordBuffer = stringToBuffer(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(passwordBuffer),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(
  privateKeyJwk: JsonWebKey,
  password: string
) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveKey(password, salt);

  const data = stringToBuffer(JSON.stringify(privateKeyJwk));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decryptPrivateKey(
  encryptedPayload: any,
  password: string
): Promise<CryptoKey> {
  const salt = new Uint8Array(base64ToBuffer(encryptedPayload.salt));
  const iv = new Uint8Array(base64ToBuffer(encryptedPayload.iv));
  const ciphertext = base64ToBuffer(encryptedPayload.ciphertext);

  const aesKey = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  const privateKeyJwk = JSON.parse(bufferToString(decrypted));

  return crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey", "deriveBits"]
  );
}
