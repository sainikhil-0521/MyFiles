"use client";
import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      alert("File exceeds 500MB limit");
      return;
    }
    const formData = new FormData();
    formData.append("filename", fileName);
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      const res = await axios.post(
        "http://localhost:3001/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message);
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Upload File
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choose File:
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Name:
          </label>
          <input
            type="text"
            placeholder="a-z A-Z 0-9 _ are allowed"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`w-full font-semibold py-2 rounded-lg transition duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {message && (
          <p className="mt-4 text-green-600 text-center font-medium">
            {message}
          </p>
        )}
        {errorMessage && (
          <p className="mt-4 text-red-600 text-center font-medium">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
