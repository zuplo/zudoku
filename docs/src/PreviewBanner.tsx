export const PreviewBanner = () => {
  return (
    <div className="text-center">
      Welcome to Zudoku preview!
      <a
        href="https://github.com/zuplo/zudoku/issues"
        className="underline hover:white"
      >
        Open a GitHub issue
      </a>{" "}
      if you have feature requests or find any issues.
    </div>
  );
};

export default PreviewBanner;
