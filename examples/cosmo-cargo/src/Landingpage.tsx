import { Button, Head, Link, Typography, useAuth } from "zudoku/components";

export const Landingpage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section>
      <Head>
        <title>Home</title>
      </Head>
      <div className="grid lg:gap-12 pb-8 lg:py-16 lg:grid-cols-12 gap-10">
        <div className="mr-auto lg:col-span-8 col-span-full mt-10 lg:mt-0">
          <h1 className="mb-10 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl">
            Ship anywhere in the{" "}
            <span className="bg-primary text-primary-foreground py-1.5 px-2.5 rounded-3xl inline-block -rotate-1">
              whole universe
            </span>
          </h1>
          <Typography className="max-w-full">
            <p>
              {isAuthenticated ? (
                <Link to="/api-shipments">Get started</Link>
              ) : (
                <Link to="/signup">Sign up for a Cosmo Cargo account</Link>
              )}{" "}
              and get access to our comprehensive shipping API. Create and
              manage shipments, track packages in real-time, and integrate with
              multiple carriers through a single, powerful interface.{" "}
              <Link to="/documentation">Read our documentation</Link> to learn
              more.
            </p>
            <p>
              Whether you're shipping across town or across galaxies, our
              platform provides the tools you need to deliver with confidence.
              From automated label generation to real-time tracking and
              interplanetary logistics, we've got your shipping needs covered.
            </p>
            <p>
              Join thousands of businesses who trust Cosmo Cargo for their
              shipping operations. Our API supports everything from small local
              deliveries to complex intergalactic supply chains.
            </p>
          </Typography>
          <div className="flex gap-4 items-center mt-6">
            <Button variant="outline" size="xl" asChild>
              <a
                href="https://zudoku.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore Zudoku
              </a>
            </Button>
            <span className="font-semibold">or</span>
            <Button size="xl" asChild>
              <Link to="/api-shipments">Get started</Link>
            </Button>
          </div>
        </div>
        <img
          src="/cosmo.webp"
          className="max-w-[330px] w-full hidden lg:mt-0 lg:col-span-4 lg:flex rounded-3xl drop-shadow-lg dark:drop-shadow-none"
        />
      </div>
    </section>
  );
};
