import { useState } from "react";
import { createNote } from "../services/createNote";
import { useAuth } from "../contexts/AuthContext";
import { JsonWebKey } from "crypto";

export default function CreateNote() {
  const [text, setText] = useState("");

  const { user, token, publicKey } = useAuth();

  async function handleCreate() {
    if (!user || !token) return;

    await createNote(text, publicKey as JsonWebKey, token);
    alert("Note created (encrypted)");
    setText("");
  }

  return (
    <div>
      <textarea
        placeholder="Write secret note"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleCreate}>Create Note</button>
    </div>
  );
}
