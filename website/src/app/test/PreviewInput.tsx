"use client";

import { useState } from "react";

export const PreviewInput = () => {
  const [input, setInput] = useState("");

  return (
    <form
      className="justify-center items-center gap-x-3 sm:flex"
      onSubmit={(e) => {
        if (e.target instanceof HTMLFormElement) {
          const formData = new FormData(e.target);
          const url = formData.get("url");

          if (typeof url === "string") {
            window.open(`/demo?api-url=${url.trim()}`);
          }

          e.preventDefault();
        }
      }}
    >
      <input
        name="url"
        type="url"
        required
        placeholder="https://example.io/openapi.json"
        className="w-full max-w-[500px] px-3 py-2.5 text-gray-400 bg-gray-700 outline-none rounded-lg shadow"
      />
      <button
        type="submit"
        className="flex items-center justify-center gap-x-2 py-2.5 px-4 mt-3 w-full text-sm text-white font-medium bg-[#ff00bd] hover:bg-[#ff00bd]/90 active:bg-[#ff00bd]/90 duration-150 rounded-lg sm:mt-0 sm:w-auto"
      >
        Get started
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </form>
  );
};
