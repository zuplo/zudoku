"use client";

import { cn } from "@/app/utils/cn";
import { animate } from "motion";
import Image from "next/image";
import { useEffect } from "react";

export const TechStack = () => {
  return (
    <section className="py-14 self-center">
      <div className="max-w-xl mx-auto px-4  md:px-8 flex flex-row">
        <div className="max-w-xl space-y-3 mt-8">
          <h3 className="text-[#ff00bd] font-semibold">
            Build with Tools You Love
          </h3>
          <p className="text-3xl font-semibold sm:text-4xl">
            Modern tech stack
          </p>
          <p>
            Zuudoku is built with modern tools and technologies. We use React,
            Tailwind CSS, TypeScript, and Vite to create a fast and responsive
            experience.
          </p>
          <div
            className={cn(
              "h-[10rem] md:h-[15rem] rounded-xl z-40 w-full",
              "bg-indigo-900/20 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]",
            )}
          >
            <TechStackBubble />
          </div>
        </div>
      </div>
    </section>
  );
};

export const TechStackBubble = () => {
  useEffect(() => {
    const transform = [
      "translateY(0px)",
      "translateY(-2px)",
      "translateY(0px)",
    ];
    const sequence = [
      [".circle-1", { transform }, { duration: 0.8 }],
      [".circle-2", { transform }, { duration: 0.8 }],
      [".circle-3", { transform }, { duration: 0.8 }],
      [".circle-4", { transform }, { duration: 0.8 }],
      [".circle-5", { transform }, { duration: 0.8 }],
    ] as const;

    animate(sequence, {
      // @ts-ignore
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="overflow-hidden h-full relative flex items-center justify-center w-full">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        <Container className="h-8 w-8 circle-1">
          <Image
            src="/logo-ts.svg"
            width={15}
            height={15}
            alt="TypeScript Logo"
          />
        </Container>
        <Container className="h-12 w-12 circle-2">
          <Image
            src="/logo-tailwind.svg"
            width={30}
            height={30}
            alt="Tailwind Logo"
          />
        </Container>
        <Container className="circle-3">
          <Image
            src="/zudoku-logo.svg"
            width={38}
            height={38}
            alt="Zudoku Logo"
          />
        </Container>
        <Container className="h-12 w-12 circle-4">
          <Image src="/logo-vite.svg" width={30} height={30} alt="Vite Logo" />
        </Container>
        <Container className="h-8 w-8 circle-5">
          <Image
            src="/logo-react.svg"
            width={20}
            height={20}
            alt="React Logo"
          />
        </Container>
      </div>
    </div>
  );
};

const Container = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        `h-16 w-16 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
    shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
    `,
        className,
      )}
    >
      {children}
    </div>
  );
};
