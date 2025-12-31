import { decryptPrivateKey } from "../crypto/password";
import { decryptAESKey } from "../crypto/hybrid";
import { decryptText } from "../crypto/symmetric";
import { EncryptedPrivateKey } from "../types/crypto";

/**
 * DIRTY DEBUG FUNCTION
 * Do NOT use in production
 */
export async function debugDecryptNote() {
  // 🔴 1. INPUTS (PASTE FROM DB)
  const password = "student@ECE415";

  const encryptedPrivateKey: EncryptedPrivateKey = {
    ciphertext:
      "NuWiuTdklfwRq7hEgcLKiStz2fJRZj4TvrrXX+jJngGCqmCqx27BG3nT/aV9/7VRZOMWnEDYm7pKoDxya6hVgX+qFAUqXt66P+ABMMd1cpkRRGpQ6wj9/tCT3lzqm0hrSQ7+63aqAzsXz5WsAkbC1kXWuJn7vrkWCYYqY1rAOQlTY68Ke2Xsl0aFTVdjiBW6vJcC1+8vTSzCB8ehJpo7Xp7mKE80XYzBWPnWdn/Co7kk96nP9ByjPjblXLVdHMjJkQhO8kodIlkPEEMAZ9kLONcqQ1FENt0uNx5PvJ7C5quVEIdQGNCEFXXp3TdfrGwR",
    iv: "tpCt9lvjvkW6wCXz",
    salt: "ST0FnfJK6J0yaIxSR1MlxQ==",
  };

  const note = {
    encryptedContent: "DZaqtmcMuovLvC5nPJ24PEh/WjoifDWxN6tu",
    iv: "tYVUbOJo4OiEGLcH",
  };

  const noteKey = {
    encryptedDEK:
      "hJFQVuaQgW+YUknpTnN4f53BcqeAHS/lCYlCBG6QjYEyqTMgmbnIrrkMZNLYgb1e",
    iv: "iuAnWaTox4qsny9H",
    ephemeralPublicKey: {
      crv: "P-256",
      ext: true,
      key_ops: [],
      kty: "EC",
      x: "9V9KcgyjqRRqhG3lCQypgBOd2fcR3rIl5PfG8seaf-8",
      y: "b1yNraQ-EiIpcUPyhMJYCJ8TtTOw-OnCiQbh8kwEj6k",
    },
  };

  try {
    const privateKey = await decryptPrivateKey(encryptedPrivateKey, password);
    console.log("Private key decrypted: ", privateKey);

    const rawDEK = await decryptAESKey(
      {
        encryptedAESKey: noteKey.encryptedDEK,
        iv: noteKey.iv,
        ephemeralPublicKey: noteKey.ephemeralPublicKey,
      },
      privateKey
    );

    console.log("DEK decrypted, raw key: ", rawDEK);

    const plaintext = await decryptText(note.encryptedContent, note.iv, rawDEK);

    console.log("🎉 DECRYPTED NOTE:", plaintext);
  } catch (e) {
    console.error("FAILED AT:", e);
  }
}
