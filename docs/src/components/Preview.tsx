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
        className="w-full h-full absolute -z-10 -top-20"
        style={{
          background: `url('/background.svg')`,
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <Hero />
      <div className="px-10 w-full relative max-w-screen-xl mt-20">
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
          <div className="border rounded-full border-[px-8] absolute -top-8 right-5 bg-white p-1.5 flex border-[black] gap-2 z-10">
            <div className="rounded-full p-3  bg-[#FFEB79] text-black border-[black] border">
              <SunIcon />
            </div>
            <div className="rounded-full p-3 ">
              <MoonStarIcon />
            </div>
          </div>
          <img
            src={`/light-portal.png`}
            loading="lazy"
            className={cn(activeTab === "api-reference" ? "hidden" : "")}
          />
          <img
            src={`/light-api.png`}
            loading="lazy"
            className={cn(activeTab === "developer-portal" ? "hidden" : "")}
          />
        </div>
      </div>
    </div>
  );
};
