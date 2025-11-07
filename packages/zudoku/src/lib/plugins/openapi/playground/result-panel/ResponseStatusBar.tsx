import { useCallback, useLayoutEffect, useRef } from "react";
import { humanFileSize } from "../../../../util/humanFileSize.js";

const ResponseCodeCircle = ({ status }: { status?: number }) => {
  if (!status) return <div className="w-2 h-2 rounded-full bg-gray-500" />;

  switch (Number(status.toString().slice(0, 1))) {
    case 2:
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    case 4:
      return <div className="w-2 h-2 rounded-full bg-yellow-400" />;
    case 5:
      return <div className="w-2 h-2 rounded-full bg-red-500" />;
    default:
      return <div className="w-2 h-2 rounded-full bg-gray-500" />;
  }
};

const RealTimeCounter = () => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<Text | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>(null);

  const updateTime = useCallback(() => {
    if (textRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      textRef.current.nodeValue = elapsed.toFixed();
    }
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  useLayoutEffect(() => {
    const currentSpanRef = spanRef.current;
    if (!currentSpanRef) return;

    // Create a text node and attach it to the span
    const textNode = document.createTextNode("0");

    currentSpanRef.appendChild(textNode);
    textRef.current = textNode;

    // Start the real-time counter
    startTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (textRef.current && currentSpanRef.contains(textNode)) {
        currentSpanRef.removeChild(textNode);
      }
    };
  }, [updateTime]);

  return <span className="inline-block text-end w-[3ch]" ref={spanRef} />;
};

export const ResponseStatusBar = ({
  status,
  time,
  size,
  isFinished,
  progress,
}: {
  status?: number;
  time?: number;
  size?: number;
  isFinished: boolean;
  progress: number;
}) => {
  const statusCodeMap: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    500: "Internal Server Error",
  };

  return (
    <div className="relative shrink-0 flex h-10 text-xs gap-4 px-4 items-center justify-between font-mono border-b">
      <div className="flex items-center gap-2">
        <ResponseCodeCircle status={status} /> {status ?? "Sending Request..."}
        {status ? ` ${statusCodeMap[status]}` : ""}
      </div>
      <div className="flex gap-2">
        <div>
          <span className="text-muted-foreground">Size</span>{" "}
          <span className="inline-block text-end min-w-[5ch]">
            {size ? humanFileSize(size) : "- B"}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">Time</span>{" "}
          {time !== undefined ? `${time.toFixed(0)}` : <RealTimeCounter />}
          ms
        </div>
      </div>
      <div
        className="h-full bg-neutral-500/10 absolute left-0 bottom-0 z-10 transition-all duration-200 ease-in-out"
        style={{
          opacity: isFinished ? 0 : 1,
          width: isFinished ? 0 : `${progress * 100}%`,
        }}
      />
    </div>
  );
};

export default ResponseStatusBar;
