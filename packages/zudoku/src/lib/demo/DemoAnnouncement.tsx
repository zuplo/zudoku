export const DemoAnnouncement = () => (
  <div className="h-12 w-full bg-pink-900 text-pink-100 text-center text-sm font-medium py-2 flex items-center justify-center ">
    This demo hosting of your OpenAPI isn't as fast or flexible as self-hosting;{" "}
    <a
      href="https://github.com/zuplo/zudoku"
      className="px-1 underline hover:white"
    >
      Get started here
    </a>{" "}
    to see Zudoku at full tilt.
  </div>
);

export default DemoAnnouncement;
