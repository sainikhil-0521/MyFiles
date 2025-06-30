"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;

  const fetchFiles = async (currentSkip = 0, reset = false) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/files?skip=${currentSkip}&limit=${LIMIT}`
      );
      const data = await res.json();

      if (reset) {
        setFiles(data);
      } else {
        setFiles((prev) => [...prev, ...data]);
      }

      if (data.length < LIMIT) {
        setHasMore(false);
      }

      setSkip(currentSkip + LIMIT);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 This effect runs once when the component mounts (resets state)
  useEffect(() => {
    setFiles([]);
    setSkip(0);
    setHasMore(true);
    setLoading(false);

    fetchFiles(0, true); // start fresh
  }, []);

  // 👇 This handles scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        fetchFiles(skip);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [skip, loading, hasMore]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Files</h1>
      <ul className="space-y-2">
        <li className="bg-white p-2 rounded shadow flex justify-between items-center font-bold">
          <span className="w-1/3">File Name</span>
          <span className="w-1/3">Created At</span>
          <span className="w-1/3">Actions</span>
        </li>

        {files.map((file) => (
          <li
            key={file.key}
            className="bg-white p-2 rounded shadow flex justify-between items-center"
          >
            <span className="w-1/3">{file.name}</span>
            <span className="w-1/3">{file.created_at}</span>
            <span className="w-1/3 space-x-4">
              <button
                onClick={() =>
                  window.open(
                    `http://localhost:3001/api/download?key=${file.key}&mode=view`,
                    "_blank"
                  )
                }
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                View
              </button>
              <button
                onClick={() =>
                  window.open(
                    `http://localhost:3001/api/download?key=${file.key}`
                  )
                }
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Download
              </button>
            </span>
          </li>
        ))}
      </ul>

      {loading && (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      )}
      {!hasMore && (
        <div className="text-center py-4 text-gray-400">No more files.</div>
      )}
    </div>
  );
}
