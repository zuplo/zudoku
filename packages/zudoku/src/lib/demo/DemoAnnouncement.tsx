export const DemoAnnouncement = () => {
  return (
    <div className="text-center">
      This demo version of your OpenAPI isn't as fast or flexible as
      self-hosting.{" "}
      <a
        href="https://github.com/zuplo/zudoku"
        className="underline hover:white"
      >
        Get started here
      </a>{" "}
      to see Zudoku at full tilt.
    </div>
  );
};

export default DemoAnnouncement;
