// src/crypto/utils.ts

export function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}
