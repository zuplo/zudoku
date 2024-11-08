export const PreviewBanner = () => {
  return (
    <div className="text-center">
      Welcome to the beta! Please{" "}
      <a
        href="https://github.com/zuplo/zudoku/issues"
        className="underline hover:white"
      >
        open a GitHub issue
      </a>{" "}
      if you have feature requests or find any issues.
    </div>
  );
};

export default PreviewBanner;
