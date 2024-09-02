import ApiReferenceLight from "@/app/assets/api-reference-light.jpg";
import Code from "@/app/components/Code";
import { Frame } from "@/app/components/Frame";
import Image from "next/image";

export const OpenAPI = () => {
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      ),
      title: "Supports OpenAPI 3.x",
      desc: "We aim to support the latest OpenAPI specification. Zudoku currently supports OpenAPI 3.x and 2.0 is coming soon. If something is missing, please let us know. This is a very active project and we are always looking to improve.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      ),
      title: "Interactive Playground",
      desc: "Zudoku generates an interactive playground for your API. You can test your API directly from the documentation. This is a great way to test your API and see the results in real-time. It also integrates with your API key so you can test your API with your own data.",
    },
  ];

  return (
    <section className="py-14">
      <div className="max-w-screen-xl mx-auto px-4 gap-16 justify-between md:px-8 lg:flex ">
        <div className=" flex-1">
          <div className="max-w-xl space-y-3">
            <h3 className="text-[#ff00bd] font-semibold">
              Open API Specification
            </h3>
            <p className="text-3xl font-semibold sm:text-4xl">
              Interactive OpenAPI documentation
            </p>
            <p>
              Use your existing OpenAPI specification to generate beautiful API
              documentation with Zudoku. Zudoku supports OpenAPI 3.x and 2.0 is
              coming soon.
            </p>
          </div>
          <div className="mt-8 max-w-lg lg:max-w-none">
            <ul className="space-y-8">
              {features.map((item, idx) => (
                <li key={idx} className="">
                  <div>
                    <h4 className="text-lg font-semibold">{item.title}</h4>
                    <p className="mt-3">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 lg:mt-0 flex-1">
          <div className="relative flex flex-col gap-2 lg:block max-w-xl mx-auto lg:mt-20 lg:mb-[450px]">
            <Frame
              className="lg:absolute lg:left-0 lg:right-0 lg:-translate-y-[10%] overflow-hidden border border-gray-800 h-min lg:scale-90 transition duration-300 ease-in-out drop-shadow-lg"
              innerPadding={false}
              inFocus={false}
            >
              <Image src={ApiReferenceLight} alt="" />
            </Frame>
            <Frame
              darkMode
              className="lg:absolute lg:left-0 lg:right-0 lg:translate-x-[25%] lg:scale-[65%]"
            >
              <Code
                code={`
{
  "openapi": "3.1.0",
  "info": {
    "title": "The Zuplo Developer API, powered by Zuplo",
    "version": "1.0.0",
    "description": "Welcome to the Zuplo API where you can manage API keys, tunnels and more. To get your API key for this service login to [portal.zuplo.com](https://portal.zuplo.com) and navigate to your project **Settings > Zuplo API Keys.** \\n\\n\\n ![API Keys](https://cdn.zuplo.com/uploads/zuplo-api-keys.png)",
  },
  "paths": {
    "/openapi": {
      "get": {
        "operationId": "openApi",
        "summary": "OpenAPI Specification",
`.trim()}
                lang="shell"
              />
            </Frame>
          </div>
        </div>
      </div>
    </section>
  );
};
