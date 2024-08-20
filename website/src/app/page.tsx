import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className={inter.className}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <a href="https://zuplo.com">
            <Image
              src="/zudoku-logo-full-dark.svg"
              alt="Zudoku Logo"
              className="hidden dark:block"
              width={142.28 * 1.15}
              height={29.68 * 1.15}
              priority
            />
            <Image
              src="/zudoku-logo-full-light.svg"
              alt="Zudoku Logo"
              className="dark:hidden"
              width={139.28 * 1.45}
              height={34.59 * 1.45}
              priority
            />
          </a>
          <div
            className="
          fixed bottom-0 left-0 flex h-48 w-full items-end justify-center
          bg-gradient-to-t from-white via-white
          dark:from-black dark:via-black
          lg:static lg:size-auto lg:bg-none"
          >
            <a
              className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
              href="https://zuplo.com?utm_source=zudoku-web&utm_medium=web&utm_content=made-by-zuplo"
              target="_blank"
              rel="noopener noreferrer"
            >
              by{" "}
              <Image
                src="/zuplo.svg"
                alt="Zuplo Logo"
                className="invert dark:invert-0"
                width={100}
                height={24}
                priority
              />
            </a>
          </div>
        </div>

        <div className="text-6xl font-bold text-center mt-14 leading-snug">
          API documentation<br />should be <span style={{ color: '#FF00BD' }}>free</span>.
        </div>

        <div className="text-1xl text-center mt-10 leading-snug">
          Zudoku is an open-source, OpenAPI powered, highly customizable<br />API documentation framework for building quality developer experiences.
        </div>

        <h2 className="mt-12 mb-4 text-2xl font-semibold">Try it with your API!</h2>

        <input
          placeholder="https://example.com/api/openapi.json"
          className="flex w-full justify-center max-w-screen-md
        border-b border-gray-300
        bg-gradient-to-b from-zinc-200
        pb-6 pt-8
        backdrop-blur-2xl
        dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit
         lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"
        />

        <div className="m-24 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Docs{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Find in-depth information about Next.js features and API.
            </p>
          </a>

          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Github{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Learn about Next.js in an interactive course with&nbsp;quizzes!
            </p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Templates{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Explore starter templates for Next.js.
            </p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Deploy{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-balance text-sm opacity-50">
              Instantly deploy your Next.js site to a shareable URL with Vercel.
            </p>
          </a>
        </div>
      </main>
      <footer>
        <div className="flex justify-center pt-8 mt-24 w-full text-zinc-600 border-t border-zinc-700 ">
          <div className="p-8 w-full max-w-screen-xl">
            <div className="mb-10 w-full">
              <ul className="flex flex-wrap flex-row items-stretch w-full gap-6 lg:gap-20 xl:gap-36">
                <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
                  <strong className="dark:text-white">Examples</strong>
                  <ul className="">
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://docs-zudoku.pages.dev"
                      >
                        Zuplo Docs
                      </a>
                    </li>
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="/demo?api-url=https://rickandmorty.zuplo.io/openapi.json"
                        target="_blank"
                      >
                        Rick and Morty
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
                  <strong className="dark:text-white">Open Source</strong>
                  <ul className="">
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://github.com/zuplo/zudoku"
                      >
                        Zudoku on Github
                      </a>
                    </li>
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://github.com/zuplo/"
                      >
                        Zuplo on Github
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
                  <strong className="dark:text-white">Community</strong>
                  <ul>
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://discord.gg/kYzGdaQ4"
                      >
                        Discord
                      </a>
                    </li>
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://twitter.com/Zuplo"
                      >
                        Twitter
                      </a>
                    </li>
                    <li className="pt-4">
                      <a
                        className="hover:text-white"
                        href="https://github.com/zuplo"
                      >
                        GitHub
                      </a>
                    </li>
                  </ul>
                </li>
                <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
                  <strong className="dark:text-white">Product</strong>
                  <ul>
                    <li className="pt-4">
                      <a className="hover:text-white" href="/setup/">
                        Getting Started
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className="w-full flex justify-center md:justify-start">
              <Image
                src="/zuplo.svg"
                height="12"
                width="80"
                className="invert dark:invert-0 inline-block hover:opacity-80"
                alt="Zuplo Logo"
              />
            </div>
            <div className="flex flex-col md:flex-row items-stretch my-10 flex-wrap gap-4">
              <div className="flex-1 text-center md:text-left">
                Copyright 2024 Zuplo. All rights reserved.
              </div>
              <div className="flex flex-1 justify-center items-center">
                <a target="_blank" href="https://twitter.com/Zuplo">
                  <Image
                    src="/twitter-logo.svg"
                    height={20}
                    width="20"
                    className="invert dark:invert-0 inline-block opacity-70 dark:opacity-40 hover:opacity-80"
                    alt="Twitter"
                  />
                </a>
                <div className="mx-4 h-full border-l border-zinc-700"></div>
                <a target="_blank" href="https://github.com/zuplo/zudoku/">
                  <Image
                    src="/github-logo.svg"
                    width="20"
                    height={20}
                    className="invert dark:invert-0 inline-block opacity-70 dark:opacity-40 hover:opacity-80"
                    alt="Zudoku on Github"
                  />
                </a>
                <div className="mx-4 h-full border-l border-zinc-700"></div>
                <a target="_blank" href="https://discord.gg/kYzGdaQ4">
                  <Image
                    src="/discord-logo.svg"
                    width="20"
                    height={20}
                    className="invert dark:invert-0 inline-block opacity-70 dark:opacity-40 hover:opacity-80"
                    alt="Discord"
                  />
                </a>
              </div>
              <div className="flex flex-1 justify-end">
                Product may contain traces of 🌲.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
