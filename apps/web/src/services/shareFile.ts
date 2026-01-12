// import { encryptAESKey } from "../crypto/hybrid";
// import { bufferToString } from "../crypto/utils";

// export async function shareFile(
//   noteId: string,
//   receiverPublicKey: JsonWebKey,
//   rawDEK: ArrayBuffer
// ): Promise<string> {
//   // encrypt DEK for receiver
//   const wrapped = await encryptAESKey(
//     bufferToString(rawDEK),
//     receiverPublicKey
//   );

//   const res = await fetch("/api/v1/share/file", {
//     method: "POST",
//     credentials: "include",
//     headers: { "Content-Type": "application/json", credentials: "include" },
//     body: JSON.stringify({
//       noteId,
//       // receiverEmail: email, // you already fetch user by email
//       encryptedDEK: wrapped.encryptedAESKey,
//       dekIv: wrapped.iv,
//       ephemeralPublicKey: wrapped.ephemeralPublicKey,
//     }),
//   });

//   const data = await res.json();
//   return data.shareLink;
// }
