import { Button } from "zudoku/components";
import FlickeringGrid from "./Flickering";

export const Landingpage = () => {
  return (
    <section className="">
      <div className="grid lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Build the{" "}
            <span className="text-primary/80">developer experience</span> like
            never before.
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
            Zudoku (pronounced "zoo-doh-koo") is an open-source, highly
            customizable API documentation framework for building quality
            developer experiences around OpenAPI and, soon, GraphQL documents.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" size="xl" asChild>
              <a href="/api">Explore Docs</a>
            </Button>
            <Button size="xl" asChild>
              <a href="/api">
                Get started
                <svg
                  className="w-5 h-5 ml-2 -mr-1 inline"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </Button>
          </div>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex rounded-3xl shadow">
          <div className="relative h-[500px] rounded-lg w-full bg-background overflow-hidden border items-center flex justify-center">
            <img
              src="/docs-static/logos/zudoku-dark.svg"
              alt="Zudoku Logo"
              className="w-80 z-10"
            />
            <FlickeringGrid
              className="z-0 absolute inset-0 size-full"
              squareSize={4}
              gridGap={6}
              color="#ff00bd"
              maxOpacity={0.5}
              flickerChance={0.1}
              height={800}
              width={800}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
