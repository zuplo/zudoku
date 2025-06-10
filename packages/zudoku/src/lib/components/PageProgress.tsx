import { useNProgress } from "@tanem/react-nprogress";
import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export const PageProgress = () => {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  // delay the animation to avoid flickering
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(isNavigating), 200);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  const { isFinished, progress } = useNProgress({ isAnimating });

  return (
    <div
      className="absolute w-0 left-0 right-0 bottom-[-1px] h-[2px] bg-primary transition-all duration-300 ease-in-out"
      style={{
        opacity: isFinished ? 0 : 1,
        width: isFinished ? 0 : `${progress * 100}%`,
      }}
    />
  );
};
