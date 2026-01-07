import { useState, ChangeEvent } from "react";

const SingleFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>
    </>
  );
};

export default SingleFileUpload;
