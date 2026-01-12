import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { decryptAESKey } from "../crypto/hybrid";
import { decryptBytes } from "../crypto/symmetric";
import { base64ToBuffer } from "../crypto/utils";
import { useAuth } from "../contexts/AuthContext";

export default function ShareDownload() {
  const { shareId } = useParams();
  const { privateKey } = useAuth();
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    async function run() {
      // 1. get metadata
      const metaRes = await fetch(
        `http://localhost:3000/api/v1/notes/metadata/share/${shareId}`,
        {
          credentials: "include",
        }
      );
      const meta = await metaRes.json();

      // 2. download encrypted file
      const fileRes = await fetch(
        `http://localhost:3000/api/v1/share/download/${shareId}`,
        {
          credentials: "include",
        }
      );
      const encryptedBuffer = await fileRes.arrayBuffer();
      console.log("encryptedBuffer", encryptedBuffer);
      // 3. decrypt DEK
      const rawDEK = await decryptAESKey(
        {
          encryptedAESKey: meta.encryptedDEK,
          iv: meta.dekIv,
          ephemeralPublicKey: meta.ephemeralPublicKey,
        },
        privateKey!
      );

      // 4. decrypt file

      let iv: number[];
      if (typeof meta.iv === "string") {
        if (meta.iv.startsWith("[")) {
          iv = JSON.parse(meta.iv);
        } else {
          iv = Array.from(new Uint8Array(base64ToBuffer(meta.iv)));
        }
      } else {
        iv = meta.iv;
      }

      const decrypted = await decryptBytes(
        encryptedBuffer,
        iv,
        base64ToBuffer(rawDEK)
      );

      // 5. save file
      const blob = new Blob([decrypted], {
        type: meta.mimeType,
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = meta.originalFileName;
      a.click();

      URL.revokeObjectURL(url);
    }
    if (privateKey && isAuthenticated) {
      run();
    }
  }, [privateKey, isAuthenticated]);

  return <p>Downloading secure file…</p>;
}
