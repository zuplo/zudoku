import { Button, Head, Link, Typography } from "zudoku/components";
import Hello from "./hello.svg";

export const Home = () => {
  return (
    <section>
      <Head>
        <title>Home</title>
      </Head>
      <div className="flex mt-15">
        <div className="flex-3 w-full">
          <h1 className="mb-10 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl">
            Meet an enhanced
            <br />
            dev experience
          </h1>
          <Typography className="max-w-full text-2xl">
            Zudoku lets you craft clean, consistent, and beautiful API
            documentation — fully customizable, open source, and actually fun to
            use.
          </Typography>
          <div className="flex gap-4 items-center mt-6">
            <Button variant="outline" size="xl" asChild>
              <a
                href="https://zudoku.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get started
              </a>
            </Button>
            <span className="font-semibold">or</span>
            <Button size="xl" asChild>
              <Link to="/docs/">Read the docs</Link>
            </Button>
          </div>
        </div>
        <img
          src={Hello}
          className="flex-2 w-full  rounded-3xl drop-shadow-lg dark:drop-shadow-none"
        />
      </div>
    </section>
  );
};
