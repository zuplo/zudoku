import { GaugeCircleIcon, GlobeIcon, TimerIcon, ZapIcon } from "zudoku/icons";
import { BentoBox, BentoDescription, BentoImage } from "./Bento";
import { Box } from "./Box";
import { BoxLongshadow } from "./BoxLongshadow";

export const BentoStaticSite = () => {
  return (
    <BentoBox className="col-span-full lg:col-span-4">
      <BentoImage className="flex flex-col items-center justify-center relative group">
        <div className="absolute top-0 left-0 w-full h-full">
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute -top-[5%] left-[2%] group-hover:scale-25 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[5%] left-[20%] group-hover:scale-25 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[1%] left-[50%] group-hover:scale-120 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[8%] left-[75%] group-hover:scale-125 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[15%] left-[95%] group-hover:scale-135 transition-all duration-300 ease-in-out animate-pulse"
          />
          {/* Next Row */}
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] -left-[5%] group-hover:scale-115 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] left-[20%] group-hover:scale-155 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[41%] left-[50%] group-hover:scale-125 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[52%] left-[70%] group-hover:scale-125 transition-all duration-300 ease-in-out animate-pulse"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] left-[90%] group-hover:scale-125 transition-all duration-300 ease-in-out animate-pulse"
          />
        </div>{" "}
        <Box className="w-full z-10">
          <div className="flex items-center gap-2 p-5 text-lg border-b border-[black] z-10">
            <GlobeIcon size={20} strokeWidth={1.5} />
            https://myapidocs.com
          </div>
          <div className="flex flex-col gap-2 p-5 pb-10">
            <div className="bg-[#9095B4]/20 h-5 w-full rounded-sm group-hover:animate-pulse group-hover:w-10/12 duration-300 ease-in-out" />
            <div className="bg-[#9095B4]/20 h-5 w-full rounded-sm group-hover:animate-pulse group-hover:w-8/12 duration-300 ease-in-out" />
            <div className="bg-[#9095B4]/20 h-5 w-1/2 rounded-sm group-hover:animate-pulse group-hover:w-9/12 duration-300 ease-in-out" />
          </div>
        </Box>
        <div className="flex gap-4 transform -translate-y-5 -translate-x-5 justify-end z-20">
          <BoxLongshadow className="rounded-full p-2.5 flex items-center justify-center">
            <GaugeCircleIcon size={22} strokeWidth={1.5} />
          </BoxLongshadow>
          <BoxLongshadow className="relative rounded-full p-2.5 flex items-center justify-center">
            <ZapIcon size={22} strokeWidth={1.5} />
            <div className="rotate-180 absolute bottom-2.5 overflow-hidden h-0 group-hover:h-full transition-all duration-800 ease-in-out">
              <ZapIcon size={22} strokeWidth={1.5} className="fill-[#FFEB79]" />
            </div>
          </BoxLongshadow>
          <BoxLongshadow className="group-hover:scale-105 ease-[cubic-bezier(0.2,10,0.83,0.67)] transition-all duration-300 relative rounded-full p-2.5 flex items-center justify-center overflow-hidden">
            <div className="absolute h-0 group-hover:h-full transition-all duration-400 ease-in-out bottom-0 w-full bg-red-400 z-1" />
            <TimerIcon
              size={22}
              strokeWidth={1.5}
              className="z-20 transition-all duration-800 ease-in-out group-hover:text-red-50"
            />
          </BoxLongshadow>
        </div>
      </BentoImage>
      <BentoDescription
        title="Static Site Generation"
        description="Ship your docs as fast, SEO-friendly static pages."
      />
    </BentoBox>
  );
};
