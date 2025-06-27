import {
  useLayoutEffect,
  useRef,
  useRef as useRefForTimeout,
  useState,
} from "react";
import { cn } from "zudoku";
import { FolderOpenIcon, SettingsIcon } from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";
import Cursor from "./Cursor";
import { SmoothCursor } from "./SmoothCursor";

export const BentoAddOpenAPI = () => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRefForTimeout<NodeJS.Timeout | null>(null);
  const boundingClientRect = ref.current?.getBoundingClientRect();
  const [position, setPosition] = useState({
    x: boundingClientRect?.left,
    y: boundingClientRect?.top,
  });

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setPosition({
      x: ref.current?.getBoundingClientRect().left,
      y: ref.current?.getBoundingClientRect().top,
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setPosition({
      x: ref.current?.getBoundingClientRect().left,
      y: ref.current?.getBoundingClientRect().top,
    });

    // Set a timeout to set isHovered to false after 200ms
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      timeoutRef.current = null;
    }, 2500);
  };

  useLayoutEffect(() => {
    setPosition({
      x: ref.current?.getBoundingClientRect().left,
      y: ref.current?.getBoundingClientRect().top,
    });
  }, [isHovered]);

  return (
    <BoxLongshadow
      className="w-full relative p-5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {position.x && position.y && (
        <SmoothCursor
          rest={!isHovered}
          cursor={<Cursor />}
          initialPosition={position}
        />
      )}

      <div className="rounded-full border border-black px-7 py-3 top-0 transform -translate-y-1/2 right-3 flex items-center gap-3 absolute bg-white">
        <FolderOpenIcon strokeWidth={1.25} /> MyZudokuProject
      </div>
      <img src="/filetree.svg" alt="tree" />
      <BoxLongshadow className="absolute -bottom-4 left-62 bg-[#FFEB79] flex items-center justify-center ">
        <SettingsIcon
          strokeWidth={1.75}
          className={cn(
            "m-2 duration-150 ease-in-out",
            isHovered && "animate-[spin_5s] ",
          )}
          size={36}
        />
        <Cursor
          ref={ref}
          className={cn(
            "absolute -bottom-6 -right-6 z-10 h-11 w-11",
            "opacity-0",
          )}
        />
      </BoxLongshadow>
    </BoxLongshadow>
  );
};

export default BentoAddOpenAPI;
