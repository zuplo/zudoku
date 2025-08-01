import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BracesIcon,
  CopyCheckIcon,
  FileJson,
  LayoutGridIcon,
  LibraryBigIcon,
  LockIcon,
  PlayCircleIcon,
  SquareCheckIcon,
  TriangleAlertIcon,
  UnplugIcon,
} from "zudoku/icons";
import {
  AnimatedLabelIcon,
  AnimatedPackageIcon,
} from "./components/AnimatedIcons";
import { BentoBox, BentoDescription, BentoImage } from "./components/Bento";
import BentoAddOpenAPI from "./components/BentoAddOpenAPI";
import { BentoAuthReady } from "./components/BentoAuthReady";
import { BentoInstall } from "./components/BentoInstall";
import BentoInternalTools from "./components/BentoInternalTools";
import { BentoStaticSite } from "./components/BentoStaticSite";
import { Box } from "./components/Box";
import { BoxLongshadow } from "./components/BoxLongshadow";
import PoweredByYou from "./components/PoweredByYou";
import { Preview } from "./components/Preview";
import { SparklesText } from "./components/Sparkles";
import { StartCustomizing } from "./components/StartCustomizing";
import Zudoku from "./components/Zudoku";
import DiscordIcon from "./DiscordIcon";
import GithubIcon from "./GithubIcon";
import "./LandingPage.css";

const Link = ({
  children,
  href,
  target,
}: {
  children: React.ReactNode;
  href: string;
  target?: string;
}) => {
  return (
    <a
      href={href}
      target={target}
      className="hover:underline decoration-2 underline-offset-4"
    >
      {children}
    </a>
  );
};

const TechStack = [
  {
    href: "https://tailwindcss.com/",
    src: "/tech/tailwind.svg",
    alt: "Tailwind CSS",
    height: 35,
  },
  {
    href: "https://react.dev/",
    src: "/tech/react.svg",
    alt: "React",
    height: 55,
  },
  {
    href: "https://typescriptlang.org/",
    src: "/tech/typescript.svg",
    alt: "TypeScript",
    height: 45,
  },
  {
    href: "https://vitejs.dev/",
    src: "/tech/vite.svg",
    alt: "Vite",
    height: 55,
  },
  {
    href: "https://radix-ui.com/",
    src: "/tech/radix.svg",
    alt: "Radix UI",
    height: 45,
  },
];

const LandingPage = () => {
  return (
    <div className="dark:bg-white dark:text-black flex flex-col w-full items-center mx-auto pt-10 gap-25 z-1">
      <div className="flex flex-col gap-6 md:flex-row items-center justify-between w-full max-w-screen-xl px-10">
        <Zudoku />
        <ul className="flex items-center gap-6 ">
          <li>
            <Link href="/docs">Documentation</Link>
          </li>
          <li>
            <Link href="/docs/components/typography">Components</Link>
          </li>
          <li>
            <Link href="/docs/theme-playground">Themes</Link>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="https://discord.gg/zudoku"
            className="gap-2 rounded-full p-2 hover:bg-accent transition"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            title="Get help on Discord"
          >
            <DiscordIcon className="w-5 h-5 " />
          </a>
          <a
            href="https://github.com/zuplo/zudoku"
            className="gap-2 rounded-full p-2 hover:bg-accent transition relative group"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="Star us on GitHub"
          >
            <SparklesText
              sparklesCount={2}
              className="absolute inset-0 bottom-1/2 left-1/2 group-hover:opacity-100 opacity-0"
            />
            <GithubIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
      <Preview />
      <div className="px-10">
        <div className="text-center font-bold text-3xl capitalize">
          Built with a{" "}
          <span className="bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
            modern stack
          </span>
        </div>
        <ul className="flex flex-col gap-10 items-center md:flex-row md:gap-20 mt-14 overflow-x-auto">
          {TechStack.map((tech) => (
            <li
              key={tech.href}
              className="shrink-0 scale-95 opacity-100 saturate-0 hover:saturate-100 hover:opacity-100 hover:scale-100 transition-all ease-in-out"
            >
              <a href={tech.href} target="_blank" rel="noreferrer">
                <img
                  src={tech.src}
                  alt={tech.alt}
                  style={{ height: tech.height }}
                />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex justify-center mt-16">
          <a
            href="https://cosmocargo.dev/"
            className="group md:text-xl font-medium border rounded-full border-[#8D83FF] bg-white text-black px-8 py-3 flex items-center gap-2 w-fit self-center group "
          >
            Check Our Live Demo
            <ArrowRightIcon
              size={20}
              strokeWidth={2.5}
              className="group-hover:translate-x-1 transition-all duration-300"
            />
          </a>
        </div>
      </div>
      <div className="w-full">
        <div className="border-t border-black w-full flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-screen-xl w-full">
            <div className="lg:col-span-2 p-10 xl:border-l md:border-r border-black">
              <h2 className="text-3xl font-semibold">Get Started</h2>
              <p>
                Three quick steps will take you from zero to powerful API docs
                in minutes.
              </p>
            </div>
            <div className="xl:border-r border-black flex items-end">
              <div className="h-full capitalize mt-auto md:border-l-0 md:border-r-0 md:h-1/2 border-t w-full border-black flex items-end md:justify-end">
                <a
                  href="/docs"
                  className="text-2xl font-semibold p-3 px-10 inline-flex items-center gap-2 hover:underline decoration-4 underline-offset-4"
                >
                  Check our Docs <ArrowUpRightIcon size={32} strokeWidth={1} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-b border-black w-full flex justify-center mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-screen-xl w-full">
            <div className="xl:border-l md:border-r border-black border-b lg:border-b-0">
              <div className="grid grid-rows-[50px_120px_100px] gap-10 p-10">
                <img src="/1.svg" alt="cli" className="w-16 h-16" />
                <BentoInstall />
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
            <div className="border-b lg:border-r border-black lg:border-b-0">
              <div className="grid grid-rows-[50px_120px_100px] gap-10 p-10">
                <img src="/2.svg" alt="cli" className="w-16 h-16" />
                <BentoAddOpenAPI />
                <div>
                  <h3 className="text-2xl font-semibold">Add your OpenAPI</h3>
                  <p className="text-muted-foreground">
                    Bring your OpenAPI schema into the project and add it to the
                    Zudoku config.
                  </p>
                </div>
              </div>
            </div>
            <StartCustomizing />
          </div>
        </div>
      </div>
      <div className="px-10 w-full flex flex-col items-center">
        <PoweredByYou />
        <h3 className="text-center text-[54px] font-bold capitalize mb-20 mt-5">
          Packed with powerful
          <br />
          features
        </h3>

        <div className="grid grid-cols-12 gap-5 max-w-screen-lg w-full">
          <BentoBox className="col-span-full md:col-span-6 lg:col-span-5">
            <BentoImage>
              <BoxLongshadow className="w-full h-[120%] flex flex-col">
                <div className="flex items-center gap-2 p-5 py-4 font-medium text-lg border-b border-black z-10 mb-2 relative">
                  <LibraryBigIcon size={20} strokeWidth={1.5} /> API Catalog
                  <div className="h-1 bg-black w-37 absolute -bottom-0.5 left-0" />
                </div>
                <div className="h-full flex gap-10 items-center justify-center">
                  <div className="flex flex-col gap-2">
                    <BoxLongshadow className="p-6 bg-[#F2F4FF] flex items-center justify-center text-black">
                      <AnimatedPackageIcon delay={0.2} />
                    </BoxLongshadow>{" "}
                    Tracking API
                  </div>
                  <div className="flex flex-col gap-2">
                    <BoxLongshadow className="p-6 bg-[#F2F4FF] flex items-center justify-center text-black">
                      <AnimatedLabelIcon delay={0.5} />
                    </BoxLongshadow>
                    Label API
                  </div>
                </div>
              </BoxLongshadow>
            </BentoImage>
            <BentoDescription
              title="API Catalog"
              description="Auto-generate docs from OpenAPI v2/v3 schemas—single or multi-API."
            />
          </BentoBox>
          <BentoAuthReady />
          <BentoBox className="col-span-full md:col-span-6 lg:col-span-4">
            <BentoImage className="font-mono group">
              <div className="grid grid-cols-[min-content_1fr_min-content] gap-2 ">
                <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                  <LockIcon size={18} />
                  <div className="flex-1">Authentication</div>
                  <SquareCheckIcon size={22} fill="#F0F1F4" strokeWidth={1.5} />
                </Box>
                <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                  <BracesIcon size={18} />
                  <div className="flex-1">Parameters</div>
                  <SquareCheckIcon size={22} fill="#F0F1F4" strokeWidth={1.5} />
                </Box>
                <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 items-center">
                  <FileJson size={18} />
                  <div className="flex-1">Body</div>
                  <SquareCheckIcon size={22} fill="#F0F1F4" strokeWidth={1.5} />
                </Box>
                <Box className="grid col-span-full grid-cols-subgrid gap-4 px-4 py-4 relative items-center justify-center">
                  <div className="text-[#FF02BD] font-bold">GET</div>
                  <div className="flex-1 col-span-2 text-[#B4B9C9] truncate">
                    https://myapi.example.com
                  </div>
                  <BoxLongshadow className="absolute -bottom-2.5 -right-2.5 p-2 bg-[#F2F4FF] flex items-center gap-2 px-3 group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all group-hover:rotate-2 group-hover:scale-105 group-hover:bg-black group-hover:text-white duration-300 ease-in-out font-bold">
                    <span className="inline-block group-hover:opacity-0 top-0 left-0">
                      Send
                    </span>
                    <SparklesText className="absolute left-3 inline-block opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                      Send
                    </SparklesText>
                    <PlayCircleIcon
                      size={24}
                      strokeWidth={1.5}
                      className="group-hover:fill-black fill-white transition-all duration-300 ease-in-out"
                    />
                  </BoxLongshadow>
                </Box>
              </div>
            </BentoImage>
            <BentoDescription
              title="Interactive Playground"
              description="Test endpoints live, with support for API keys and auth."
            />
          </BentoBox>
          <BentoBox className="col-span-full md:col-span-6 lg:col-span-4">
            <BentoImage className="flex items-center justify-center group">
              <div className="flex flex-col transform translate-y-3.5">
                <img
                  src="/search/search.svg"
                  alt="Search"
                  className="scale-90 group-hover:scale-100 transition-all duration-300 ease-in-out"
                />
                <div className="relative h-20 flex -top-5 items-center justify-end scale-80 group-hover:scale-100 group-hover:translate-x-1 group-hover:translate-y-1 transition-all duration-300 ease-in-out">
                  <div className="flex-shrink-0 w-full h-1"></div>
                  <img
                    src="/search/cmd.svg"
                    alt="CMD Key"
                    className="flex-2 group-hover:-rotate-10 transition-all duration-300 ease-in-out"
                  />
                  <img
                    src="/search/k.svg"
                    alt="K Key"
                    className="flex-2 group-hover:rotate-10 transition-all group-hover:-translate-x-3 duration-300 ease-in-out"
                  />
                </div>
              </div>
            </BentoImage>
            <BentoDescription
              title="Built-in Search"
              description="Instant, intelligent search powered by Pagefind, Inkeep, etc."
            />
          </BentoBox>
          <BentoStaticSite />
        </div>
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
          className="hover:drop-shadow transition-all duration-300 text-xl rounded-full bg-black text-white px-8 py-3 flex items-center gap-2 w-fit self-center group"
        >
          Learn More{" "}
          <ArrowRightIcon
            size={20}
            className="group-hover:translate-x-1 transition-all duration-300"
          />
        </a>
      </div>
      <div
        className="px-10 w-full bg-black rounded-3xl p-10 text-white shadow-[0px_-2px_16px_-4px_rgba(0,_0,_0,_0.5)]"
        style={{
          animation: "remove-scale 1s cubic-bezier(0, 0.93, 1, 0.61) forwards",
          animationTimeline: "view()",
          animationRange: "entry 0% cover 15%",
        }}
      >
        <div className="max-w-screen-lg mx-auto flex flex-col items-center">
          <div className="rounded-full drop-shadow border border-[#8D83FF] p-1 px-3 my-10">
            Designed to Scale
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
                description="Easy integration with existing plugins (both community and core) and easy extensibility for creating your own."
              />
            </BentoBox>
            <BentoBox className="col-span-12 md:col-span-6 lg:col-span-5">
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
                  <div className=" flex-col absolute top-5 -right-8 bg-white p-4 rounded-lg border border-black flex  gap-2">
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

            <BentoInternalTools />
            <BentoBox className="col-span-full lg:col-span-7">
              <BentoImage className="flex items-center justify-center w-full">
                <div className="grid grid-cols-12 gap-4 w-full">
                  <BoxLongshadow className="h-20 col-span-3 sm:col-span-2 font-bold flex items-center justify-center text-2xl">
                    Aa
                  </BoxLongshadow>
                  <BoxLongshadow className="h-20 col-span-9 sm:col-span-10 flex items-center justify-center">
                    <span className="font-mono">
                      &lt;
                      <span className="text-[#FF02BD]">
                        OpenPlaygroundButton
                      </span>
                      &nbsp;
                      <span className="hidden sm:inline">{"{...props}"}</span>
                      <span className="">&nbsp;/&gt;</span>
                    </span>
                  </BoxLongshadow>
                  <BoxLongshadow className="h-20 col-span-8 flex items-center justify-center p-4">
                    <div className="rounded-full h-10 w-10 border border-black font-bold flex-shrink-0 flex items-center justify-center">
                      1
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-black font-bold flex-shrink-0 flex items-center justify-center">
                      2
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-black font-bold flex-shrink-0 flex items-center justify-center">
                      3
                    </div>
                    <div className="h-[1px] w-full bg-black" />
                    <div className="rounded-full h-10 w-10 border border-black font-bold flex-shrink-0 flex items-center justify-center">
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
                description="Create the developer experience you've always dreamed of with a full suite of reusable components (or create your own)."
              />
            </BentoBox>
          </div>
          <div className="flex flex-col md:flex-row gap-4 my-10">
            <a
              href="https://zudoku.dev/docs/quickstart"
              className="text-lg font-medium rounded-full bg-white justify-center text-black px-8 py-3 flex items-center gap-2 w-full md:w-fit self-center group"
            >
              Explore the Docs
            </a>
            <div className="md:text-lg font-mono font-medium border border-white rounded-full bg-black text-white px-8 py-3 flex items-center gap-2 w-fit self-center group">
              npm create zudoku@latest
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-screen-lg mx-auto my-25 items-end gap-4">
          <h3 className="font-bold text-5xl capitalize">
            Join our open
            <br />
            community
            <br />
            of developers
          </h3>
          <div className="flex-1 flex flex-col items-start md:flex-row my-10 lg:my-0 lg:justify-end md:items-end gap-4">
            <a
              href="https://discord.gg/zudoku"
              className="w-full md:w-fit font-medium text-lg bg-[#7362EF] text-white px-6 py-2 rounded-full text-nowrap"
            >
              Join our Discord
            </a>
            <a
              href="https://github.com/zuplo/zudoku"
              className="w-full md:w-fit font-medium text-lg px-6 py-2 rounded-full border border-[#7362EF] text-nowrap relative"
            >
              <SparklesText sparklesCount={4}>Star on GitHub</SparklesText>
            </a>
          </div>
        </div>
      </div>
      <div className="px-10 grid grid-cols-1 md:grid-cols-2 w-full max-w-screen-lg mb-30 mt-10">
        <div className="flex flex-col gap-10">
          <Zudoku />
          <h2 className="capitalize font-medium text-3xl">
            Zudoku is free, open-source,
            <br />
            and ready to power your docs.
          </h2>
        </div>
        <div className="flex flex-col gap-1 md:items-end md:justify-end mt-20 md:mt-0">
          <a
            href="https://github.com/zuplo/zudoku"
            className="hover:underline decoration-2 underline-offset-4"
          >
            View on GitHub
          </a>
          <a
            href="https://cosmocargo.dev"
            className="hover:underline decoration-2 underline-offset-4"
          >
            See Live Example
          </a>
          <a
            href="https://zudoku.dev/docs"
            className="hover:underline decoration-2 underline-offset-4"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
