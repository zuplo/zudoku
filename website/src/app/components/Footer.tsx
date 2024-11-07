import Image from "next/image";

export const Footer = () => (
  <footer>
    <div className="flex justify-center pt-8 mt-24 w-full text-zinc-400/80 border-t border-zinc-700 ">
      <div className="p-8 w-full max-w-screen-xl">
        <div className="mb-10 w-full">
          <ul className="flex flex-wrap flex-row items-stretch w-full gap-6 lg:gap-20 xl:gap-36">
            <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
              <strong className="text-white">Examples</strong>
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
              <strong className="text-white">Product</strong>
              <ul>
                <li className="pt-4">
                  <a
                    className="hover:text-white"
                    href="https://zudoku.dev/docs/app-quickstart"
                  >
                    Getting Started
                  </a>
                </li>
              </ul>
            </li>
            <li className="flex-1 min-w-[180px] flex items-center flex-col md:block">
              <strong className="text-white">Community</strong>
              <ul>
                <li className="pt-4">
                  <a
                    className="hover:text-white"
                    href="https://discord.gg/9tfNGyN4de"
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
              <strong className="text-white">Open Source</strong>
              <ul className="">
                <li className="pt-4">
                  <a
                    className="hover:text-white"
                    href="https://github.com/zuplo/zudoku"
                  >
                    Zudoku on GitHub
                  </a>
                </li>
                <li className="pt-4">
                  <a
                    className="hover:text-white"
                    href="https://github.com/zuplo/"
                  >
                    Zuplo on GitHub
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="w-full flex justify-center md:justify-start">
          <a href="https://zuplo.com">
            <Image
              src="/zuplo.svg"
              height="12"
              width="80"
              className="inline-block hover:opacity-80"
              alt="Zuplo Logo"
            />
          </a>
        </div>
        <div className="flex flex-col md:flex-row items-stretch my-10 flex-wrap gap-4">
          <div className="flex-1 text-center md:text-left">
            Copyright {new Date().getUTCFullYear()} Zuplo. All rights reserved.
          </div>
          <div className="flex flex-1 justify-center items-center">
            <a target="_blank" href="https://twitter.com/Zuplo">
              <Image
                src="/twitter-logo.svg"
                height={20}
                width="20"
                className="inline-block opacity-40 hover:opacity-80"
                alt="Twitter"
              />
            </a>
            <div className="mx-4 h-full border-l border-zinc-700"></div>
            <a target="_blank" href="https://github.com/zuplo/zudoku/">
              <Image
                src="/github-logo.svg"
                width="20"
                height={20}
                className="inline-block opacity-40 hover:opacity-80"
                alt="Zudoku on GitHub"
              />
            </a>
            <div className="mx-4 h-full border-l border-zinc-700"></div>
            <a target="_blank" href="https://discord.zudoku.dev">
              <Image
                src="/discord-logo.svg"
                width="20"
                height={20}
                className="inline-block opacity-40 hover:opacity-80"
                alt="Discord"
              />
            </a>
          </div>
          <div className="flex flex-1 justify-end">{"✌️"}</div>
        </div>
      </div>
    </div>
  </footer>
);
