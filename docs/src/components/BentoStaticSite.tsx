import { GaugeCircleIcon, GlobeIcon, TimerIcon, ZapIcon } from "zudoku/icons";
import { BentoBox, BentoDescription, BentoImage } from "./Bento";
import { Box } from "./Box";
import { BoxLongshadow } from "./BoxLongshadow";

export const BentoStaticSite = () => {
  return (
    <BentoBox className="col-span-full lg:col-span-4">
      <BentoImage className="flex flex-col items-center justify-center relative">
        <div className="absolute top-0 left-0 w-full h-full">
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute -top-[5%] left-[2%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[5%] left-[20%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[1%] left-[50%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[8%] left-[75%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[15%] left-[95%]"
          />
          {/* Next Row */}
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] -left-[5%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] left-[20%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[41%] left-[50%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[52%] left-[70%]"
          />
          <img
            src="/zap.svg"
            alt="Zap Zap!"
            className="absolute top-[45%] left-[90%]"
          />
        </div>{" "}
        <Box className="w-full z-10">
          <div className="flex items-center gap-2 p-5 text-lg border-b border-[black] z-10">
            <GlobeIcon size={20} strokeWidth={1.5} />
            https://myapidocs.com
          </div>
          <div className="flex flex-col gap-2 p-5 pb-10">
            <div className="bg-[#9095B4]/20 h-5 w-full rounded-sm" />
            <div className="bg-[#9095B4]/20 h-5 w-full rounded-sm" />
            <div className="bg-[#9095B4]/20 h-5 w-1/2 rounded-sm" />
          </div>
        </Box>
        <div className="flex gap-4 transform -translate-y-5 -translate-x-5 justify-end z-20">
          <BoxLongshadow className="rounded-full p-2.5 flex items-center justify-center">
            <GaugeCircleIcon size={22} strokeWidth={1.5} />
          </BoxLongshadow>
          <BoxLongshadow className="rounded-full p-2.5 flex items-center justify-center">
            <ZapIcon size={22} strokeWidth={1.5} />
          </BoxLongshadow>
          <BoxLongshadow className="rounded-full p-2.5 flex items-center justify-center">
            <TimerIcon size={22} strokeWidth={1.5} />
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
