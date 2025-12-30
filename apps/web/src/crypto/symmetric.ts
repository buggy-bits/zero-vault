// src/crypto/symmetric.ts

import {
  stringToBuffer,
  bufferToString,
  bufferToBase64,
  base64ToBuffer,
} from "./utils";

export async function encryptText(plaintext: string) {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    stringToBuffer(plaintext) as BufferSource
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedText: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    rawKey: bufferToBase64(rawKey),
  };
}

export async function decryptText(
  encryptedText: string,
  ivBase64: string,
  rawKeyBase64: string
) {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBuffer(rawKeyBase64),
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(ivBase64)) },
    key,
    base64ToBuffer(encryptedText)
  );

  return bufferToString(decrypted);
}
