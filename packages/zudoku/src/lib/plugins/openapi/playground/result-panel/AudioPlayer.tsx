import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { humanFileSize } from "../../../../util/humanFileSize.js";

export const AudioPlayer = ({
  blob,
  fileName,
  size,
  onDownload,
}: {
  blob: Blob;
  fileName: string;
  size: number;
  onDownload: () => void;
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  if (!audioUrl) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-muted-foreground">Loading audio...</div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* biome-ignore lint/a11y/useMediaCaption: API response audio cannot have predefined captions */}
        <audio controls src={audioUrl} className="w-full max-w-md">
          Your browser does not support the audio element.
        </audio>
        <Button onClick={onDownload} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Download {fileName} ({humanFileSize(size)})
        </Button>
      </div>
    </div>
  );
};
