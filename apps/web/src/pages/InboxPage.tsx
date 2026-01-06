import { useEffect, useState } from "react";
import { decryptAESKey } from "../crypto/hybrid";
import { decryptText } from "../crypto/symmetric";
import { useAuth } from "../contexts/AuthContext";

type EncryptedNote = {
  noteId: string;
  encryptedContent: string;
  iv: string;
  encryptedDEK: string;
  dekIv: string;
  ephemeralPublicKey: JsonWebKey;
  createdAt: string;
};

export default function ReceiverInbox() {
  const { token, privateKey } = useAuth();

  const [notes, setNotes] = useState<EncryptedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch("http://localhost:3000/api/v1/notes", {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch notes");

      const data = await res.json();
      setNotes(data);
    } catch {
      setError("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  async function decryptNote(note: EncryptedNote) {
    if (!privateKey) return;

    // 1. Decrypt DEK
    const rawDEK = await decryptAESKey(
      {
        encryptedAESKey: note.encryptedDEK,
        iv: note.dekIv,
        ephemeralPublicKey: note.ephemeralPublicKey,
      },
      privateKey
    );

    // 2. Decrypt note
    const plaintext = await decryptText(note.encryptedContent, note.iv, rawDEK);

    alert(plaintext);
  }

  if (loading) return <p>Loading inbox…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Your Secure Inbox</h2>

      {notes.length === 0 && <p>No notes yet.</p>}

      {notes.map((note) => (
        <div
          key={note.noteId}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p>
            <strong>Encrypted Note</strong>
            <br />
            Created: {new Date(note.createdAt).toLocaleString()}
          </p>

          <button onClick={() => decryptNote(note)}>Decrypt & View</button>
        </div>
      ))}
    </div>
  );
}
