import { ArrowRightIcon, CopyIcon, MoonStarIcon, SunIcon } from "zudoku/icons";
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

const PoweredByYou = () => {
  return (
    <div className="bg-white drop-shadow-md rounded-full inline-block px-4 py-2 border border-[#8D83FF]">
      Powered by You
    </div>
  );
};

const Kasten = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`border border-[black] rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white ${className}`}
    >
      {children}
    </div>
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
    <div
      className={cn(
        "border overflow-hidden  border-[black] bg-white text-black rounded-md",
        className,
      )}
    >
      {children}
    </div>
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
      className={cn("h-[350px] p-8", className)}
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
    <div
      className={cn(
        "border border-[black] rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-5",
        className,
      )}
    >
      {children}
    </div>
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
    <div className="border-t border-[black] flex flex-col gap-3 p-5">
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
          <div className="grid grid-cols-3 max-w-screen-xl w-full">
            <div className="col-span-2 p-10 border-l border-[black]">
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
          <div className="grid grid-cols-3 max-w-screen-xl w-full">
            <div className="border-r border-l border-[black]">
              <div className="flex flex-col gap-8 p-10">
                <img src="/1.svg" alt="cli" className="w-16 h-16" />
                <Kasten className="w-full">
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
                </Kasten>
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
            <div>
              <div className="flex flex-col gap-4 p-10">
                <img src="/2.svg" alt="cli" className="w-16 h-16" />
                <Kasten className="w-full h-16" />
                <h3 className="text-2xl font-semibold">Add your OpenAPI</h3>
                <p className="text-muted-foreground">npm run zudoku install</p>
              </div>
            </div>
            <div className="border-l border-r border-[black]">
              <div className="flex flex-col gap-2 p-10">
                <img src="/3.svg" alt="cli" className="w-16 h-16" />
                <Kasten className="w-full h-16" />
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
        <BentoBox className="col-span-5">
          <BentoImage>
            <Kasten className="w-full h-full" />
          </BentoImage>
          <BentoDescription
            title="API Catalog"
            description="Auto-generate docs from OpenAPI v2/v3 schemas—single or multi-API."
          />
        </BentoBox>
        <BentoBox className="col-span-7">
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
        <BentoBox className="col-span-4">
          <BentoImage />
          <BentoDescription
            title="Interactive Playground"
            description="Test your API with a built-in playground, complete with request builder and response viewer."
          />
        </BentoBox>
        <BentoBox className="col-span-4">
          <BentoImage />
          <BentoDescription
            title="Built-in Search"
            description="Built-in search for your API docs, perfect for SEO and performance."
          />
        </BentoBox>
        <BentoBox className="col-span-4">
          <BentoImage />
          <BentoDescription
            title="Static Site Generation"
            description="Generate static HTML pages for your API docs, perfect for SEO and performance."
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
        <div className="flex justify-between w-full">
          <img src="/host/vercel.svg" alt="Vercel" />
          <img src="/host/cloudflare.svg" alt="Cloudflare" />
          <img src="/host/netlify.svg" alt="Netlify" />
          <img src="/host/zuplo.svg" alt="Zuplo" />
        </div>

        <a
          href=""
          className="text-2xl font-semibold rounded-full bg-black text-white px-10 py-4 flex items-center gap-2 w-fit self-center"
        >
          Learn More <ArrowRightIcon size={20} />
        </a>
      </div>
      <div className="w-full bg-black rounded-3xl p-10 text-white">
        <div className="max-w-screen-lg mx-auto flex flex-col items-center">
          <div className="rounded-full drop-shadow border border-[#8D83FF] p-1 px-3">
            Uses Cases
          </div>
          <h3 className="text-5xl font-semibold text-center">
            Supercharge your Docs
            <br />
            in every scenario
          </h3>
          <div className="grid grid-cols-12 gap-5 max-w-screen-lg w-full">
            <BentoBox className="col-span-7">
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
            <BentoBox className="col-span-5">
              <BentoImage>
                <Kasten className="w-full h-full" />
              </BentoImage>
              <BentoDescription
                title="MDX Support"
                description="Generate documentation from markdown files, perfect for SEO and performance."
              />
            </BentoBox>

            <BentoBox className="col-span-4">
              <BentoImage />
              <BentoDescription
                title="Interactive Playground"
                description="Test your API with a built-in playground, complete with request builder and response viewer."
              />
            </BentoBox>
            <BentoBox className="col-span-4">
              <BentoImage />
              <BentoDescription
                title="Built-in Search"
                description="Built-in search for your API docs, perfect for SEO and performance."
              />
            </BentoBox>
            <BentoBox className="col-span-4">
              <BentoImage />
              <BentoDescription
                title="Static Site Generation"
                description="Generate static HTML pages for your API docs, perfect for SEO and performance."
              />
            </BentoBox>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPageTest;
