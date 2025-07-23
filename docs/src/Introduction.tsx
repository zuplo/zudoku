import BoxLongshadow from "./components/BoxLongshadow";

const CardTitle = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-2xl font-semibold">{children}</div>;
};

const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-6 flex flex-col gap-2">{children}</div>;
};

const CardDescription = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-md text-muted-foreground">{children}</div>;
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-[url(/grid.svg)] bg-repeat bg-center flex items-end w-full h-50 p-8 relative border-b border-black">
      {children}
    </div>
  );
};

export const Introduction = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-10 py-10">
      <BoxLongshadow>
        <CardHeader>
          <img src="/quickstart.svg" alt="Zudoku" className="h-16 w-16" />
        </CardHeader>

        <CardContent>
          <CardTitle>Quickstart</CardTitle>
          <CardDescription>
            Learn how to install Zudoku, configure your first project, and
            generate your first docs.
          </CardDescription>
        </CardContent>
      </BoxLongshadow>

      <BoxLongshadow>
        <CardHeader>
          <img src="/themes.svg" alt="Zudoku" className="h-16 w-16" />
        </CardHeader>
        <CardContent>
          <CardTitle>Themes</CardTitle>
          <CardDescription>
            Learn how to install Zudoku, configure your first project, and
            generate your first docs.
          </CardDescription>
        </CardContent>
      </BoxLongshadow>

      <BoxLongshadow>
        <CardHeader>
          <img src="/components.svg" alt="Zudoku" className="h-16 w-16 z-20" />
        </CardHeader>
        <CardContent>
          <CardTitle>Components</CardTitle>
          <CardDescription>
            Learn how to install Zudoku, configure your first project, and
            generate your first docs.
          </CardDescription>
        </CardContent>
      </BoxLongshadow>
      <BoxLongshadow>
        <CardHeader>
          <img
            src="/authentication.svg"
            alt="Zudoku"
            className="h-16 w-16 z-20"
          />
        </CardHeader>
        <CardContent>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Learn how to install Zudoku, configure your first project, and
            generate your first docs.
          </CardDescription>
        </CardContent>
      </BoxLongshadow>
    </div>
  );
};

export default Introduction;
