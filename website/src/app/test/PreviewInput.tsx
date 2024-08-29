"use client";

export const PreviewInput = () => {
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
        className="w-full px-4 py-3.5 text-gray-400 bg-slate-700 outline-none rounded-lg shadow font-medium text-md"
      />
      <button
        type="submit"
        className="whitespace-nowrap flex items-center justify-center gap-x-2 py-4 px-4 mt-3 w-full text-sm text-white font-medium bg-[#ff00bd] hover:bg-[#ff00bd]/80 active:bg-[#ff00bd]/80 duration-150 rounded-lg sm:mt-0 sm:w-auto"
      >
        Try it out
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
