import { useEffect, useState } from "react";
import ShareFileModal from "../components/ShareFileModel";

export default function MyFiles() {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/notes/files", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setFiles);
  }, []);

  return (
    <div>
      <h2>My Files</h2>

      <ul>
        {files.map((file) => (
          <li key={file._id}>
            {file.originalFileName}
            <button onClick={() => setSelectedFile(file)}>Share</button>
          </li>
        ))}
      </ul>

      {selectedFile && (
        <ShareFileModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
