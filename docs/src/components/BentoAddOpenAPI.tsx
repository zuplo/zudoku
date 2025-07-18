import { cn } from "zudoku";
import { FolderOpenIcon, SettingsIcon } from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";
import Cursor from "./Cursor";

export const BentoAddOpenAPI = () => {
  return (
    <BoxLongshadow className="w-full relative p-5 overflow-visible group">
      <div className="rounded-full border border-black px-7 py-3 top-0 transform -translate-y-1/2 right-3 flex items-center gap-3 absolute bg-white">
        <FolderOpenIcon strokeWidth={1.25} /> MyZudokuProject
      </div>
      <img src="/filetree.svg" alt="tree" />
      <BoxLongshadow className="absolute -bottom-4 left-62 bg-[#FFEB79] flex items-center justify-center  overflow-visible">
        <SettingsIcon
          strokeWidth={1.75}
          className={cn(
            "m-2 duration-150 ease-in-out",
            "group-hover:animate-[spin_5s] ",
          )}
          size={36}
        />
        <Cursor className="z-10 h-11 w-11 absolute -bottom-6 -right-6 group-hover:animate-wiggle" />
      </BoxLongshadow>
    </BoxLongshadow>
  );
};

export default BentoAddOpenAPI;
