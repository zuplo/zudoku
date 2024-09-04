import { useCallback, useState } from "react";

const useFileDrop = ({ onFilesAdded }: { onFilesAdded: () => void }) => {
  const [highlight, setHighlight] = useState(false);

  const preventDefault = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e) => {
      preventDefault(e);
      setHighlight(true);
    },
    [preventDefault],
  );

  const handleDragLeave = useCallback(
    (e) => {
      preventDefault(e);
      setHighlight(false);
    },
    [preventDefault],
  );

  const handleDragOver = useCallback(
    (e) => {
      preventDefault(e);
    },
    [preventDefault],
  );

  const handleDrop = useCallback(
    (e) => {
      preventDefault(e);
      setHighlight(false);

      const files = Array.from(e.dataTransfer.files);
      if (onFilesAdded) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded, preventDefault],
  );

  return {
    highlight,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};

export default useFileDrop;
