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

// 🔁 reuse WebCrypto, AES-GCM

export async function encryptBytes(data: ArrayBuffer) {
  // 1. Generate AES key (DEK)
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt bytes
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // 3. Export raw DEK (for wrapping)
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedData: new Uint8Array(encryptedBuffer), // bytes
    iv: Array.from(iv), // for JSON
    rawKey, // ArrayBuffer
  };
}

export async function decryptBytes(
  encryptedData: ArrayBuffer,
  iv: number[],
  rawKey: ArrayBuffer
) {
  // Validate the key length before importing it
  if (rawKey.byteLength !== 16 && rawKey.byteLength !== 32) {
    throw new Error("AES key data must be 128 or 256 bits (16 or 32 bytes).");
  }

  // Validate IV length for AES-GCM (typically 12 bytes)
  if (iv.length !== 12) {
    throw new Error(
      "Initialization Vector (IV) for AES-GCM must be 12 bytes long."
    );
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      encryptedData
    );

    return decrypted; // ArrayBuffer
  } catch (error) {
    console.error("Decryption failed:", error);
    // Re-throw a more descriptive error or handle it as appropriate for your application
    throw new Error(
      `Failed to decrypt data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
