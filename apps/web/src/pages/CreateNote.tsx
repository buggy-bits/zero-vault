import { useState } from "react";
import { createNote } from "../services/createNote";
import { useAuth } from "../contexts/AuthContext";
import { JsonWebKey } from "crypto";
import ConnectDriveButton from "../components/ConnectDriveButton";
import UploadFile from "./UploadFile";

export default function CreateNote() {
  const [text, setText] = useState("");

  const { user, publicKey } = useAuth();

  async function handleCreate() {
    if (!user) return;

    await createNote(text, publicKey as JsonWebKey);
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

      <ConnectDriveButton />

      <br />
      <br />
      <br />
      <UploadFile />
    </div>
  );
}
