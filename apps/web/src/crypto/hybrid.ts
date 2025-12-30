// src/crypto/hybrid.ts

import { base64ToBuffer, bufferToBase64 } from "./utils";

export async function encryptAESKey(
  rawAESKeyBase64: string,
  recipientPublicKeyJwk: JsonWebKey
) {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    recipientPublicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const sharedKey = await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    ephemeralKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    base64ToBuffer(rawAESKeyBase64)
  );

  const ephemeralPublicKey = await crypto.subtle.exportKey(
    "jwk",
    ephemeralKeyPair.publicKey
  );

  return {
    encryptedAESKey: bufferToBase64(encryptedKey),
    iv: bufferToBase64(iv.buffer),
    ephemeralPublicKey,
  };
}

export async function decryptAESKey(
  encryptedPayload: any,
  recipientPrivateKey: CryptoKey
) {
  const ephemeralPublicKey = await crypto.subtle.importKey(
    "jwk",
    encryptedPayload.ephemeralPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedKey = await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: ephemeralPublicKey,
    },
    recipientPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(base64ToBuffer(encryptedPayload.iv)),
    },
    sharedKey,
    base64ToBuffer(encryptedPayload.encryptedAESKey)
  );

  return bufferToBase64(decrypted);
}
