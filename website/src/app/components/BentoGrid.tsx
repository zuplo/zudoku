export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto">
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="row-span-1 rounded-xl group/bento hover:scale-[102.5%] hover:shadow-xl transition duration-200 shadow-none p-4 bg-black/20 border-black/40 justify-between flex flex-col space-y-4">
      {header}
      <div>
        {icon}
        <div className="font-sans font-bold text-neutral-200 mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-sm text-neutral-300 opacity-80">
          {description}
        </div>
      </div>
    </div>
  );
};
