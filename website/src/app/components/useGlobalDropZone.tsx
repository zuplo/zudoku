import { useEffect, useRef, useState } from "react";

export const useGlobalDropZone = ({
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  onDrop: (files: File[]) => void;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const latestOnDrop = useRef(onDrop);
  const latestOnDragStart = useRef(onDragStart);
  const latestOnDragEnd = useRef(onDragEnd);

  useEffect(() => {
    latestOnDrop.current = onDrop;
    latestOnDragStart.current = onDragStart;
    latestOnDragEnd.current = onDragEnd;
  });

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      latestOnDragStart.current?.(e);
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      latestOnDragEnd.current?.(e);
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      latestOnDragEnd.current?.(e);
      setIsDragging(false);

      if (e.dataTransfer?.files) {
        latestOnDrop.current(Array.from(e.dataTransfer.files));
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  return { isDragging };
};
