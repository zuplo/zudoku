import { useState } from "react";
import { cn } from "../../../packages/zudoku/src/lib/util/cn";
import { BoxLongshadow } from "./BoxLongshadow";
import Cursor from "./Cursor";
import ZudokuLogo from "./ZudokuLogo";

export const StartCustomizing = () => {
  const [[selectedColor, selectedText], setSelectedColor] = useState<
    [string, "light" | "dark"]
  >([null, null]);
  return (
    <div className="xl:border-r border-black">
      <div className="grid grid-rows-[50px_120px_100px] gap-10 p-10">
        <img src="/lsd.svg" alt="cli" className="w-16 h-16" />
        <BoxLongshadow
          className={cn(
            "w-full relative flex flex-col transition-colors duration-1500 ease-in-ou overflow-visible",
            selectedText === "light" ? "text-white" : "text-black",
          )}
          style={{
            backgroundColor: selectedColor,
          }}
        >
          <div
            className={cn(
              "p-4 py-2 border-b transition-colors duration-1500 ease-in-out",
              selectedText !== "light" ? "border-black" : "border-white",
            )}
          >
            <ZudokuLogo className="w-8 h-8" />
          </div>
          <ul className="flex gap-x-4 p-4 items-center h-full">
            <li>Docs</li>
            <li>Components</li>
            <li>Themes</li>
          </ul>
          <BoxLongshadow
            className={cn(
              "p-2 gap-1 grid grid-cols-2 grid-rows-2 absolute right-5 -bottom-9 group overflow-visible",
            )}
          >
            <button
              onClick={() => setSelectedColor(["#201E3A", "light"])}
              type="button"
              className="h-7 w-7 rounded-sm bg-[#201E3A] hover:scale-110 transition-all duration-300"
            ></button>
            <button
              onClick={() => setSelectedColor(["#FEA9FC", "dark"])}
              type="button"
              className="h-7 w-7 rounded-sm bg-[#FEA9FC] hover:scale-110 transition-all duration-300"
            ></button>
            <button
              onClick={() => setSelectedColor(["#8D83FF", "dark"])}
              type="button"
              className="h-7 w-7 rounded-sm bg-[#8D83FF] hover:scale-110 transition-all duration-300"
            ></button>
            <button
              onClick={() => setSelectedColor(["#FFEB79", "dark"])}
              type="button"
              className="h-7 w-7 rounded-sm bg-[#FFEB79] hover:scale-110 transition-all duration-300"
            ></button>
            <Cursor className="h-11 w-11 absolute -bottom-5 -right-5 group-hover:scale-0 transition-all group-hover:translate-x-1/2 duration-150 ease-in-out " />
          </BoxLongshadow>
        </BoxLongshadow>
        <div>
          <h3 className="text-2xl font-semibold">Start Customizing</h3>
          <p className="text-muted-foreground">
            Use Zudoku's flexible customization features to add your own brand
            and style.
          </p>
        </div>
      </div>
    </div>
  );
};
