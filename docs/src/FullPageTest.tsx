import {
  ArrowRightIcon,
  BracesIcon,
  CopyCheckIcon,
  CopyIcon,
  FileJson,
  GaugeCircleIcon,
  GlobeIcon,
  LayoutGridIcon,
  LockIcon,
  MoonStarIcon,
  PlayCircleIcon,
  SquareCheckIcon,
  SunIcon,
  TimerIcon,
  TriangleAlertIcon,
  UnplugIcon,
  ZapIcon,
} from "zudoku/icons";
import { cn } from "zudoku/ui/util.js";

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

const Box = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("border border-[black] rounded-md bg-white", className)}>
      {children}
    </div>
  );
};

const PoweredByYou = () => {
  return (
    <div className="bg-white drop-shadow-md rounded-full inline-block px-4 py-2 border border-[#8D83FF]">
      Powered by You
    </div>
  );
};

const BoxLongshadow = ({
  children,
  className,
  shadowLength = "medium",
}: {
  children?: React.ReactNode;
  className?: string;
  shadowLength?: "medium" | "large";
}) => {
  return (
    <Box
      className={cn(
        shadowLength === "medium" && "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        shadowLength === "large" && "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className,
      )}
    >
      {children}
    </Box>
  );
};

const BentoBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Box className={cn("overflow-hidden text-black", className)}>
      {children}
    </Box>
  );
};

const BentoImage = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn("h-[330px] overflow-hidden p-8", className)}
      style={{
        background: `url('/grid.svg')`,
        backgroundPosition: "top center",
        backgroundRepeat: "repeat-x",
      }}
    >
      {children}
    </div>
  );
};

const AuthCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Box
      className={cn(
        "rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5",
        className,
      )}
    >
      {children}
    </Box>
  );
};

const BentoDescription = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="border-t border-[black] flex flex-col gap-3 p-8">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-xl">{description}</p>
    </div>
  );
};

const FullPageTest = () => {
  return (
    <div className="flex flex-col w-full items-center mx-auto pt-10 gap-10">
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
        <div className="w-full relative max-w-screen-xl mt-20">
          <div className="border rounded-full border-[black] absolute -top-10 left-10 bg-white p-1.5 flex">
            <div className="rounded-full p-3 px-8 bg-black text-white">
              Developer Portal
            </div>
            <div className="rounded-full p-3 px-8">API Reference</div>
          </div>
          <div className="border rounded-full border-[px-8] absolute -top-10 right-10 bg-white p-1.5 flex border-[black] gap-2">
            <div className="rounded-full p-3  bg-[#FFEB79] text-black border-[black] border">
              <SunIcon />
            </div>
            <div className="rounded-full p-3 ">
              <MoonStarIcon />
            </div>
          </div>
          <div className="w-full rounded-3xl h-[600px] bg-black flex flex-col items-center mx-auto"></div>
        </div>
      </div>
      <div className="mt-16">
        <div className="text-center font-bold text-4xl capitalize">
          Built with a{" "}
          <span className="bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
            modern stack
          </span>
        </div>
        <div className="flex gap-20 mt-12">
          <img src="/tech/radix.svg" alt="stack" />
          <img src="/tech/react.svg" alt="stack" />
          <img src="/tech/typescript.svg" alt="stack" />
          <img src="/tech/vite.svg" alt="stack" />
          <img src="/tech/radix.svg" alt="stack" />
        </div>
      </div>
      <div className="w-full ">
        <div className="border-t border-[black] w-full flex justify-center">
          <div className="grid grid-cols-2 lg:grid-cols-3 max-w-screen-xl w-full">
            <div className="lg:col-span-2 p-10 border-l border-[black]">
              <h2 className="text-3xl font-semibold">Get Started</h2>
              <p>
                Get your docs running extremely fast in three steps you can get
                your api running
              </p>
            </div>
            <div className="capitalize border-l border-r border-[black]">
              Check our Docs
            </div>
          </div>
        </div>
        <div className="border-t border-b border-[black] w-full flex justify-center mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-screen-xl w-full">
            <div className="border-r border-l border-[black] border-b lg:border-b-0">
              <div className="flex flex-col gap-8 p-10">
                <img src="/1.svg" alt="cli" className="w-16 h-16" />
                <BoxLongshadow className="w-full">
                  <div className="font-mono font-medium text-center gap-2 relative border-b border-[black] h-12 flex items-center justify-center">
                    <div className="flex items-center gap-2 absolute left-4 top-5">
                      <div className="w-2.5 h-2.5 bg-neutral-200 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-neutral-200 rounded-full" />
                    </div>
                    terminal
                  </div>
                  <div className="flex justify-between items-center p-5">
                    <div className="font-mono font-medium">
                      npm <span className="text-[#E379E0]">create</span>
                      zudoku@latest
                    </div>
                    <CopyIcon className="w-5 h-5" />
                  </div>
                </BoxLongshadow>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-semibold">
                    Install on your CLI
                  </h3>
                  <p className="text-muted-foreground">
                    npm run zudoku install
                  </p>
                </div>
              </div>
            </div>
            <div className="border-b border-[black] lg:border-b-0">
              <div className="flex flex-col gap-4 p-10">
                <img src="/2.svg" alt="cli" className="w-16 h-16" />
                <BoxLongshadow className="w-full h-16" />
                <h3 className="text-2xl font-semibold">Add your OpenAPI</h3>
                <p className="text-muted-foreground">npm run zudoku install</p>
              </div>
            </div>
            <div className="border-l border-r border-[black]">
              <div className="flex flex-col gap-2 p-10">
                <img src="/3.svg" alt="cli" className="w-16 h-16" />
                <BoxLongshadow className="w-full h-16" />
                <h3 className="text-2xl font-semibold">Start Customizing!</h3>
                <p className="text-muted-foreground">npm run zudoku install</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PoweredByYou />
      <h3 className="text-center text-5xl font-bold capitalize">
        Packed with powerful
        <br />
        features
      </h3>

      <div className="grid grid-cols-12 gap-5 max-w-screen-lg w-full">
        <BentoBox className="col-span-full md:col-span-6 lg:col-span-5">
          <BentoImage>
            <BoxLongshadow className="w-full h-full" />
          </BentoImage>
          <BentoDescription
            title="API Catalog"
            description="Auto-generate docs from OpenAPI v2/v3 schemas—single or multi-API."
          />
        </BentoBox>
        <BentoBox className="col-span-full md:col-span-6 lg:col-span-7">
          <BentoImage className="flex items-center justify-center">
            <div className="flex w-full justify-around">
              <AuthCard className="bg-[#B6A0FB] rotate-14">
                <img src="/auth/clerk.svg" alt="Clerk" className="w-12 h-12" />
              </AuthCard>
              <AuthCard className="bg-[#FF02BD] -rotate-10">
                <img
                  src="/auth/firebase.svg"
                  alt="Firebase"
                  className="w-12 h-12"
                />
              </AuthCard>
              <AuthCard className="bg-[#FEA9FC] rotate-10">
                <img src="/auth/yo.svg" alt="Yoga" className="w-12 h-12" />
              </AuthCard>
              <AuthCard className="bg-[#5A4FC0] -rotate-14">
                <img
                  src="/auth/supabase.svg"
                  alt="Supabase"
                  className="w-12 h-12"
                />
              </AuthCard>
            </div>
          </BentoImage>
          <BentoDescription
            title="Auth Ready"
            description="Built-in authentication and authorization support for OAuth2, JWT, and more."
          />
        </BentoBox>
        <BentoBox className="col-span-full md:col-span-6 lg:col-span-4">
          <BentoImage className="font-mono">
            <div className="grid grid-cols-[min-content_1fr_min-content] gap-2 ">
              <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                <LockIcon size={18} />
                <div className="flex-1">Authentication</div>
                <SquareCheckIcon size={18} fill="#B4B9C9" />
              </Box>
              <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                <BracesIcon size={18} />
                <div className="flex-1">Parameters</div>
                <SquareCheckIcon size={18} fill="#B4B9C9" />
              </Box>
              <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                <FileJson size={18} />
                <div className="flex-1">Body</div>
                <SquareCheckIcon size={18} fill="#B4B9C9" />
              </Box>
              <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 relative items-center justify-center">
                <div className="text-[#FF02BD] font-bold">GET</div>
                <div className="flex-1 col-span-2 text-[#B4B9C9] truncate">
                  https://myapi.example.com
                </div>
                <BoxLongshadow className="absolute -bottom-2.5 -right-2.5 p-2 bg-[#F2F4FF] flex items-center gap-2 px-3">
                  Send
                  <PlayCircleIcon size={24} strokeWidth={1.5} fill="#FFF" />
                </BoxLongshadow>
              </Box>
            </div>
          </BentoImage>
          <BentoDescription
            title="Interactive Playground"
            description="Test endpoints live, with support for API keys and auth"
          />
        </BentoBox>
        <BentoBox className="col-span-full md:col-span-6 lg:col-span-4">
          <BentoImage className="flex items-center justify-center">
            <div className="flex flex-col">
              <img src="/search/search.svg" alt="Search" />
              <div className="relative h-20 flex -top-5 items-center justify-end">
                <div className="flex-shrink-0 w-full h-1"></div>
                <img src="/search/cmd.svg" alt="CMD Key" className="flex-2" />
                <img src="/search/k.svg" alt="K Key" className="flex-2" />
              </div>
            </div>
          </BentoImage>
          <BentoDescription
            title="Built-in Search"
            description="Instant, intelligent search powered by Inkeep."
          />
        </BentoBox>
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
      </div>
      <div className="mt-16 w-full max-w-screen-lg flex flex-col items-center gap-16">
        <div className="text-center font-semibold text-5xl capitalize">
          Host it{" "}
          <span className=" bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
            Anywhere
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-center lg:grid-cols-4  w-full gap-5">
          <div className="flex items-center justify-center">
            <img src="/host/vercel.svg" alt="Vercel" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/host/cloudflare.svg" alt="Cloudflare" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/host/netlify.svg" alt="Netlify" />
          </div>
          <div className="flex items-center justify-center">
            <img src="/host/zuplo.svg" alt="Zuplo" />
          </div>
        </div>

        <a
          href="https://zudoku.dev/docs"
          className="hover:drop-shadow transition-all duration-300 text-2xl font-semibold rounded-full bg-black text-white px-10 py-4 flex items-center gap-2 w-fit self-center group"
        >
          Learn More{" "}
          <ArrowRightIcon
            size={20}
            className="group-hover:translate-x-1 transition-all duration-300"
          />
        </a>
      </div>
      <div className="w-full bg-black rounded-3xl p-10 text-white">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center">
          <div className="rounded-full drop-shadow border border-[#8D83FF] p-1 px-3 my-10">
            Use Cases
          </div>
          <h3 className="text-5xl font-semibold text-center mb-30">
            Supercharge your Docs
            <br />
            in every scenario
          </h3>
          <div className="grid grid-cols-12 gap-5 max-w-screen-lg w-full">
            <BentoBox className="col-span-full lg:col-span-7">
              <BentoImage className="flex items-center justify-center">
                <div className="flex w-full justify-around">
                  <img src="/puzzle/puzzle-1.svg" alt="Puzzle" />
                  <img src="/puzzle/puzzle-2.svg" alt="Puzzle" />
                  <img src="/puzzle/puzzle-3.svg" alt="Puzzle" />
                  <img src="/puzzle/puzzle-4.svg" alt="Puzzle" />
                </div>
              </BentoImage>
              <BentoDescription
                title="Supercharged Plugins"
                description="Integrates easily witheasy extensible with own plugins community and core plugins"
              />
            </BentoBox>
            <BentoBox className="col-span-6 lg:col-span-5">
              <BentoImage>
                <BoxLongshadow
                  shadowLength="large"
                  className="w-11/12 h-[120%] bg-[#F2F4FF] p-6 relative"
                >
                  <code className="font-mono whitespace-pre-wrap leading-loose text-[#9095B4]">
                    {`# Welcome 
**API** docs rule 
--- 
## Getting Started 
- Edit the markdowne bar 
- See it live 
---`}
                  </code>
                  <div className=" flex-col absolute top-5 -right-8 bg-white p-4 rounded-lg border border-[black] flex  gap-2">
                    <span className="text-2xl font-bold">Welcome</span>
                    <span>API docs are what we love.</span>
                    <hr className="bg-neutral-300 h-[2px]" />
                    <span className="text-xl font-bold">Getting Started</span>
                    <ul className="list-disc list-inside pl-4">
                      <li>Edit the markdown</li>
                      <li>See it live</li>
                    </ul>
                    <img
                      src="/happy-lsd.svg"
                      alt="Happy"
                      className="absolute top-4 -right-5"
                    />
                  </div>
                </BoxLongshadow>
              </BentoImage>
              <BentoDescription
                title="MDX Support"
                description="Generate documentation from markdown files, perfect for SEO and performance."
              />
            </BentoBox>

            <BentoBox className="col-span-6 lg:col-span-5">
              <BentoImage className="flex items-center justify-center">
                <BoxLongshadow className="w-full h-full bg-[#F2F4FF]"></BoxLongshadow>
              </BentoImage>
              <BentoDescription
                title="Internal Tools"
                description="Document internal APIs for faster dev workflows"
              />
            </BentoBox>
            <BentoBox className="col-span-full lg:col-span-7">
              <BentoImage className="flex items-center justify-center w-full">
                <div className="grid grid-cols-12 gap-4 w-full">
                  <BoxLongshadow className="h-20 col-span-3 sm:col-span-2 font-bold flex items-center justify-center text-2xl">
                    Aa
                  </BoxLongshadow>
                  <BoxLongshadow className="h-20 col-span-9 sm:col-span-10 flex items-center justify-center">
                    <span className="font-mono">
                      {"<"}
                      <span className="text-[#FF02BD]">
                        OpenPlaygroundButton
                      </span>{" "}
                      <span className="hidden sm:inline">{"{...props} "}</span>
                      <span className="">{" />"}</span>
                    </span>
                  </BoxLongshadow>
                  <BoxLongshadow className="h-20 col-span-8 flex items-center justify-center p-4">
                    <div className="rounded-full h-10 w-10 border border-[black] font-bold flex-shrink-0 flex items-center justify-center">
                      1
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-[black] font-bold flex-shrink-0 flex items-center justify-center">
                      2
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-[black] font-bold flex-shrink-0 flex items-center justify-center">
                      3
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-[black] font-bold flex-shrink-0 flex items-center justify-center">
                      4
                    </div>
                  </BoxLongshadow>
                  <BoxLongshadow className="h-20 col-span-4 flex items-center justify-around px-4">
                    <TriangleAlertIcon size={20} strokeWidth={1.5} />
                    <UnplugIcon
                      size={20}
                      strokeWidth={1.5}
                      className="hidden md:inline-block"
                    />
                    <CopyCheckIcon size={20} strokeWidth={1.5} />
                    <LayoutGridIcon
                      size={20}
                      strokeWidth={1.5}
                      className="hidden sm:inline-block"
                    />
                  </BoxLongshadow>
                </div>
              </BentoImage>
              <BentoDescription
                title="Ready to use Components"
                description="Integrates easily witheasy extensible with own plugins community and core plugins"
              />
            </BentoBox>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPageTest;
