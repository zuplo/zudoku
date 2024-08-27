import { PreviewInput } from "@/app/test/PreviewInput";
import Image from "next/image";
import "../globals.css";
import { AnimatedHeading } from "./AnimatedHeading";
import Code from "./Code";
import { Features } from "./Features";
import { Footer } from "./Footer";
import { Frame } from "./Frame";
import screenshot from "./screenshot.jpg";

const Test = async () => {
  const Brand = () => (
    <div className="flex items-center justify-between py-5 md:block">
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

  return (
    <div className="min-h-full bg-gray-900">
      <header>
        <nav className="pb-5 md:text-sm">
          <div className="gap-x-14 items-center max-w-screen-xl mx-auto px-4 md:flex md:px-8 flex justify-between">
            <Brand />
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Image
                  src="/zuplo.svg"
                  alt="Zuplo Logo"
                  className="invert dark:invert-0"
                  width={100}
                  height={16}
                  priority
                />
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                  ></path>
                </svg>
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <section className="relative">
        <div className="relative max-w-screen-xl mx-auto px-4 py-28 md:px-8">
          <div className="space-y-8 max-w-4xl mx-auto text-center">
            <AnimatedHeading />
            <p className="max-w-2xl mx-auto text-gray-400">
              Zudoku is an open-source, OpenAPI powered, highly customizable API
              documentation framework for building quality developer
              experiences.
            </p>
            <PreviewInput />
            <div className="flex gap-2 max-w-2xl mx-auto items-center">
              <strong>Examples:</strong>
              <ul className="flex gap-2">
                <li className="">
                  <a
                    className="py-1.5 px-2 bg-gray-600/75 rounded-md hover:bg-gray-600 transition-colors"
                    href="https://docs-zudoku.pages.dev/"
                    target="_blank"
                  >
                    Zuplo Documentation
                  </a>
                </li>
                <li className="">
                  <a
                    className="py-1.5 px-2 bg-gray-600/75 rounded-md hover:bg-gray-600 transition-colors"
                    href="/demo?api-url=https://rickandmorty.zuplo.io/openapi.json"
                    target="_blank"
                  >
                    Rick & Morty API
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-2xl mx-auto">
        <div className="flex gap-12 my-12 flex-col items-center">
          <h3 className="text-5xl font-bold">
            Build it <span className="text-[#ff00bd]">your</span> way
          </h3>
          <p className=" text-center text-gray-400">
            Get going with Zudoku in a few simple steps:
            <br />
            Add it to your HTML, get the package or let{" "}
            <a href="https://zuplo.com" target="_blank">
              Zuplo
            </a>{" "}
            host it for you!
          </p>
        </div>
      </section>

      <section className="relative max-w-xl mx-auto mt-32 mb-[450px]">
        <Frame
          darkMode
          inFocus={false}
          className="absolute left-0 right-0 -translate-x-1/3 scale-[80%]"
        >
          <Code
            code={`
\$ npx create zudoku-app@latest
\$ npx run zudoku dev
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
          className="absolute left-0 right-0 translate-x-[25%] -translate-y-[10%] overflow-hidden border border-gray-800 h-[330px] scale-90 hover:scale-100 transition duration-300 ease-in-out drop-shadow-lg"
          innerPadding={false}
        >
          <Image src={screenshot} alt="" />
        </Frame>
      </section>
      {/*      <Frame className="mx-auto max-w-2xl" darkMode>
        <Code
          className=""
          code={`<!doctype html>
<html>
  <head>
    <script type="module" src="https://cdn.zudoku.dev/latest/main.js" crossorigin></script>
    <link rel="stylesheet" href="https://cdn.zudoku.dev/latest/style.css" crossorigin />
  </head>
  <body>
    <div data-api-url="{URL_PLACEHOLDER}"></div>
  </body>
</html>`}
          lang="html"
        />
      </Frame>*/}
      <Features />
      <section>
        <div className="flex gap-12 my-12 flex-col items-center">
          <h3 className="text-3xl font-semibold">Get started</h3>

          <Frame className="w-full max-w-2xl" darkMode>
            <Code code="npx create zudoku-app@latest" lang="shell" />
          </Frame>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Test;
