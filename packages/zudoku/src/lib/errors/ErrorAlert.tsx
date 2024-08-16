// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ErrorAlert({ error }: { error: any }) {
  const message = error?.message ?? "Something went wrong";
  const stack = error?.stack;

  return (
    <div className="flex h-screen max-h-screen min-h-full items-center justify-center bg-primary-background px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-[85%] sm:max-w-[50%]">
        <h1 className="text-4xl font-bold tracking-tight text-h1-text sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-5 text-h1-text">{message}</p>
        {stack ? (
          <pre className="mt-5 max-h-[400px] w-full overflow-scroll rounded-md border border-input-border bg-input-background p-3 text-property-name-text text-red-700">
            {stack}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
