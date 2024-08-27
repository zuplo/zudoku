"use client";

import { Typewriter } from "react-simple-typewriter";

export const AnimatedHeading = () => {
  return (
    <h2 className="text-4xl font-extrabold mx-auto md:text-5xl">
      API documentation
      <br />
      should be{" "}
      <span className="text-[#ff00bd]">
        <Typewriter
          cursor
          loop
          delaySpeed={5000}
          onLoopDone={() => {
            console.log("Loop finished! 1");
          }}
          words={[
            "free",
            "simple",
            "adaptable",
            "open source",
            "flexible",
            "pluggable",
          ]}
        />
      </span>
    </h2>
  );
};
