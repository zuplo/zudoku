import DocsScreenshot from "@/app/assets/docs-light.jpg";
import { FeatureGrid } from "@/app/components/FeatureGrid";
import { OpenAPI } from "@/app/components/OpenAPI";
import { PreviewInput } from "@/app/components/PreviewInput";
import { headers } from "next/headers";
import Image from "next/image";
import "../globals.css";
import { AnimatedHeading } from "./AnimatedHeading";
import Code from "./Code";
import { Footer } from "./Footer";
import { Frame } from "./Frame";

const Brand = () => (
  <div className="flex items-center justify-between md:block">
    <div
      className="absolute pointer-events-none inset-0 m-auto max-w-xs h-[400px] blur-[118px] sm:max-w-md md:max-w-lg"
      style={{
        background:
          "linear-gradient(106.89deg, rgba(192, 132, 252, 0.11) 15.73%, rgba(14, 165, 233, 0.41) 15.74%, rgba(232, 121, 249, 0.26) 56.49%, rgba(79, 70, 229, 0.4) 115.91%)",
      }}
    />
    <a href="#">
      <img src="/zudoku-logo-full-dark.svg" width={120} height={50} />
    </a>
  </div>
);

const Page = async () => {
  const allHeaders = headers();
  const domain =
    allHeaders.get("x-forwarded-host") ||
    allHeaders.get("host") ||
    "zudoku.dev";
  const protocol = headers().get("x-forwarded-proto") || "https";

  const baseExampleUrl = `${protocol}://${domain}`;

  return (
    <div className="min-h-full bg-gray-900 p-4 lg:p-0">
      <header>
        <nav className="pb-5 md:text-sm">
          <div className="h-24 flex items-center max-w-screen-xl mx-auto px-4 md:flex md:px-8 justify-between">
            <Brand />
            <div className="flex gap-4">
              <a href="/docs" className="hover:text-gray-300">
                Documentation
              </a>
              <a target="_blank" href="https://github.com/zuplo/zudoku/">
                <Image
                  src="/github-logo.svg"
                  width="20"
                  height={20}
                  className="inline-block hover:opacity-80"
                  alt="Zudoku on Github"
                />
              </a>
              <a target="_blank" href="https://discord.zudoku.dev">
                <Image
                  src="/discord-logo.svg"
                  width="20"
                  height={20}
                  className="inline-block hover:opacity-80"
                  alt="Discord"
                />
              </a>
            </div>
          </div>
        </nav>
      </header>
      <section className="relative">
        <div className="relative max-w-screen-xl mx-auto px-4 py-28 md:px-8">
          <div className="space-y-8 max-w-3xl mx-auto text-center">
            <AnimatedHeading />
            <p className="max-w-2xl mx-auto text-slate-400">
              Zudoku is an open-source, OpenAPI powered, highly customizable API
              documentation framework for building quality developer
              experiences.
            </p>
            <div>
              <PreviewInput sample={`${baseExampleUrl}/petstore.oas.json`} />
              <div className="flex gap-2 mt-6 items-center font-medium text-gray-300 text-xs">
                <strong>Examples:</strong>
                <ul className="flex gap-2">
                  <li>
                    <a
                      className="py-1.5 px-2 bg-slate-700 text-gray-400 rounded-md hover:bg-slate-400 hover:text-gray-900 transition-colors"
                      href="https://docs-zudoku.pages.dev/"
                      target="_blank"
                    >
                      Zuplo
                    </a>
                  </li>
                  <li>
                    <a
                      className="py-1.5 px-2 bg-slate-700 text-gray-400 rounded-md hover:bg-slate-400 hover:text-gray-900 transition-colors"
                      href={`/demo?api-url=${baseExampleUrl}/rick-and-morty.oas.json`}
                      target="_blank"
                    >
                      Rick & Morty API
                    </a>
                  </li>
                  <li>
                    <a
                      className="py-1.5 px-2 bg-slate-700 text-gray-400 rounded-md hover:bg-slate-400 hover:text-gray-900 transition-colors"
                      href={`/demo?api-url=${baseExampleUrl}/petstore.oas.json`}
                      target="_blank"
                    >
                      Petstore API
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-2xl mx-auto">
        <div className="flex gap-8 my-4 flex-col items-center">
          <h3 className="text-4xl font-bold text-center">
            Get started with <span className="text-[#ff00bd]">your</span> docs
          </h3>
          <p className="text-center text-gray-400">
            Get going with Zudoku is super easy.
            <br />
            Add it to your HTML, get the package or let{" "}
            <a
              href="https://zuplo.com"
              target="_blank"
              className="text-[#ff00bd]"
            >
              Zuplo
            </a>{" "}
            host it for you!
          </p>
        </div>
      </section>
      <section className="relative flex flex-col-reverse gap-2 lg:block max-w-xl mx-auto lg:mt-20 lg:mb-[450px]">
        <Frame
          darkMode
          inFocus={false}
          className="lg:absolute lg:left-0 lg:right-0 lg:-translate-x-1/3 lg:scale-[80%]"
        >
          <Code
            code={`
\$ npm create zudoku-app@latest
\$ npx zudoku dev
> zudoku dev

Server-side rendering enabled
Started local development setup
Ctrl+C to exit

🚀 Zudoku Portal: http://localhost:9000
`.trim()}
            lang="shell"
          />
        </Frame>
        <Frame
          className="lg:absolute lg:left-0 lg:right-0 lg:translate-x-[25%] lg:-translate-y-[10%] overflow-hidden border border-gray-800 lg:scale-90 hover:scale-95 transition duration-300 ease-in-out drop-shadow-lg h-min"
          innerPadding={false}
        >
          <Image src={DocsScreenshot} alt="" />
        </Frame>
      </section>

      <div className="flex gap-6 my-12 flex-col items-center">
        <h3 className="text-3xl font-bold text-center mb-0">
          Ready? Let&apos;s set you up!
        </h3>
        <p className="text-center text-gray-400">
          Run the following command to get started with Zudoku in your project.
        </p>
        <Frame className="w-full max-w-2xl" darkMode>
          <Code code="npm create zudoku-app@latest" lang="shell" />
        </Frame>
      </div>
      <div className="h-20" />
      <FeatureGrid />

      <div className="h-20" />
      <OpenAPI />

      <Footer />
    </div>
  );
};

export default Page;
