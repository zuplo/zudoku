import { useReducer } from "react";
import { cn } from "zudoku";
import { MoonStarIcon, SunIcon } from "zudoku/icons";

const Hero = () => {
  return (
    <div className="max-w-screen-sm flex flex-col items-center gap-6">
      <h1 className="text-7xl font-bold text-center leading-tight">
        You API Deserves
        <br />
        <span className="bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
          Better Docs.
        </span>
      </h1>
      <p className="text-center text-[21px]">
        Create clean, consistent API docs with Zudoku — open source, extensible,
        and developer-first
      </p>
    </div>
  );
};

export const Preview = () => {
  const [theme, toggleTheme] = useReducer(
    (theme) => (theme === "light" ? "dark" : "light"),
    "light",
  );

  const [activeTab, toggleTab] = useReducer(
    (tab) =>
      tab === "developer-portal" ? "api-reference" : "developer-portal",
    "developer-portal",
  );

  return (
    <div className="w-full flex flex-col items-center overflow-hidden relative gap-16">
      <div
        className="w-full h-[calc(100%-10vh)] absolute -z-10"
        style={{
          background: `url('/background.svg')`,
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <Hero />
      <div className="px-10 w-full relative max-w-screen-xl mt-20">
        <div className="relative w-fit mx-auto">
          <button
            type="button"
            onClick={toggleTab}
            className="border rounded-full border-black absolute scale-80 md:scale-100 -top-8 left-5 bg-white p-1.5 flex z-10"
          >
            <div
              className={cn(
                "rounded-full p-3 px-8 relative",
                activeTab === "developer-portal" &&
                  "text-white tab-active bg-black rounded-full",
              )}
            >
              Developer Portal
            </div>
            <div
              className={cn(
                "rounded-full p-3 px-8 relative",
                activeTab === "api-reference" &&
                  "text-white tab-active bg-black rounded-full",
              )}
            >
              API Reference
            </div>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="grid grid-cols-2 bottom-3 md:bottom-auto border rounded-full border-[px-8] absolute scale-80 md:scale-100 md:-top-8 right-5 bg-white p-1.5 border-black gap-2 z-10"
          >
            <div
              className={cn(
                "rounded-full p-3 text-black border-[transparent] border",
                theme === "light" && "bg-[#FFEB79] border-[black]",
              )}
            >
              <SunIcon />
            </div>
            <div
              className={cn(
                "rounded-full p-3 ",
                theme === "dark" && "bg-black text-white",
              )}
            >
              <MoonStarIcon />
            </div>
          </button>
          <div className="relative group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 scale-80 group-hover:scale-100 ease-[cubic-bezier(.47,.08,.2,2.18)] transition duration-400 flex items-center justify-center p-12">
              <a
                href="http://cosmocargo.dev"
                target="_blank"
                rel="noreferrer"
                className="text-white text-xl bg-primary border border-black px-6 py-3 rounded-full font-bold hover:scale-105 hover:drop-shadow-lg transition"
              >
                See Live Example
              </a>
            </div>
            <img
              src="/preview/light-portal.svg"
              className={cn(
                activeTab === "developer-portal" && theme === "light"
                  ? ""
                  : "hidden",
              )}
            />
            <img
              src="/preview/light-api.svg"
              className={cn(
                activeTab === "api-reference" && theme === "light"
                  ? ""
                  : "hidden",
              )}
            />
            <img
              src="/preview/dark-portal.svg"
              className={cn(
                activeTab === "developer-portal" && theme === "dark"
                  ? ""
                  : "hidden",
              )}
            />
            <img
              src="/preview/dark-api.svg"
              className={cn(
                activeTab === "api-reference" && theme === "dark"
                  ? ""
                  : "hidden",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
