import { Button, Head, Link } from "zudoku/components";

export const NotFound = () => {
  return (
    <section className="flex items-center justify-center py-20">
      <Head>
        <title>Lost in Space - 404</title>
      </Head>
      <div className="text-center max-w-lg mx-auto">
        <p className="text-6xl font-extrabold text-primary mb-4">404</p>
        <h1 className="text-3xl font-bold mb-4">Lost in Deep Space</h1>
        <p className="text-muted-foreground mb-8">
          Looks like this cargo shipment drifted into an uncharted sector. Our
          quantum scanners couldn't locate the page you're looking for.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/">Return to Base Station</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/documentation">Browse Star Charts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
