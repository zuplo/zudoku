export const ShadowCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-lg border dark:border-white dark:bg-black border-black bg-white shadow-[15px_15px_0px_2px_rgba(0,_0,_0,_1)] dark:shadow-[15px_15px_0px_2px_rgba(255,255,_255,_1)]">
      {children}
    </div>
  );
};

export const CardTitle = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-2xl font-bold px-4">{children}</div>;
};

export const CardDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="text-sm text-muted-foreground px-4">{children}</div>;
};
