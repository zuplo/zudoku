import { useState } from "react";
import { cn } from "zudoku";
import { MoonStarIcon, SunIcon } from "zudoku/icons";
import PoweredByYou from "./PoweredByYou";

const Hero = () => {
  return (
    <div className="max-w-screen-sm flex flex-col items-center gap-10">
      <PoweredByYou />
      <h1 className="text-7xl font-bold text-center leading-tight">
        You API Deserves
        <br />
        <span className="bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
          Better Docs.
        </span>
      </h1>
      <p className="text-center text-2xl">
        Create clean, consistent API docs with Zudoku — open source, extensible,
        and developer-first
      </p>
    </div>
  );
};

export const Preview = () => {
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("developer-portal");

  return (
    <div className="w-full flex flex-col items-center overflow-hidden relative">
      <div
        className="w-full h-[calc(100%-10vh)] absolute -z-10"
        style={{
          background: `url('/background.svg')`,
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <Hero />
      <div className="px-10 w-full relative max-w-screen-xl mt-20  ">
        <div className="relative w-fit mx-auto">
          <div className="border rounded-full border-[black] absolute -top-8 left-5 bg-white p-1.5 flex z-10">
            <button
              type="button"
              className={`rounded-full p-3 px-8 ${
                activeTab === "developer-portal" ? "bg-black text-white" : ""
              }`}
              onClick={() => setActiveTab("developer-portal")}
            >
              Developer Portal
            </button>
            <button
              type="button"
              className={`rounded-full p-3 px-8 ${activeTab === "api-reference" ? "bg-black text-white" : ""}`}
              onClick={() => setActiveTab("api-reference")}
            >
              API Reference
            </button>
          </div>
          <b className="bottom-3 md:bottom-auto border rounded-full border-[px-8] absolute md:-top-8 right-5 bg-white p-1.5 flex border-[black] gap-2 z-10">
            <button
              type="button"
              className={cn(
                "rounded-full p-3  text-black border-[transparent] border",
                theme === "light" && "bg-[#FFEB79] border-[black]",
              )}
              onClick={() =>
                setTheme((theme) => (theme === "light" ? "dark" : "light"))
              }
            >
              <SunIcon />
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full p-3 ",
                theme === "dark" && "bg-black text-white",
              )}
              onClick={() =>
                setTheme((theme) => (theme === "dark" ? "light" : "dark"))
              }
            >
              <MoonStarIcon />
            </button>
          </b>
          <img
            src={`/light-portal.png`}
            className={cn(
              activeTab === "developer-portal" && theme === "light"
                ? ""
                : "hidden",
            )}
          />
          <img
            src={`/light-api.png`}
            className={cn(
              activeTab === "api-reference" && theme === "light"
                ? ""
                : "hidden",
            )}
          />
          <img
            src={`/dark-portal.png`}
            className={cn(
              activeTab === "developer-portal" && theme === "dark"
                ? ""
                : "hidden",
            )}
          />
          <img
            src={`/dark-api.png`}
            className={cn(
              activeTab === "api-reference" && theme === "dark" ? "" : "hidden",
            )}
          />
        </div>
      </div>
    </div>
  );
};
