"use client";
import Link from "next/link";
import { IsSideBarOpenContext } from "@/context/SideBarProvider";
import { useContext } from "react";

export default function Sidebar() {
  const { isSideBarOpen, setIsSideBarOpen } = useContext(IsSideBarOpenContext);
  return (
    <>
      {isSideBarOpen ? (
        <aside className="w-64 h-screen bg-gray-800 text-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Dropbox</h2>
            <button
              onClick={() => setIsSideBarOpen(false)}
              className="hover:text-red-400 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <nav className="space-y-2">
            <Link
              href="/"
              className="block px-2 py-1 hover:bg-gray-700 rounded"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="block px-2 py-1 hover:bg-gray-700 rounded"
            >
              Upload
            </Link>
          </nav>
        </aside>
      ) : (
        <button
          className="mb-4 bg-gray-800 text-white px-2  rounded pb-[41%] h-screen cursor-pointer"
          onClick={() => setIsSideBarOpen(true)}
        >
          ☰
        </button>
      )}
    </>
  );
}
