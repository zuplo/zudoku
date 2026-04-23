export function isBinaryContentType(contentType: string) {
  return /^(application\/octet-stream|image\/|audio\/|video\/|font\/|application\/pdf|application\/zip|application\/x-protobuf|application\/x-binary)/i.test(
    contentType,
  );
}

export function isAudioContentType(contentType: string) {
  return /^audio\//i.test(contentType);
}

export const extractFileName = (
  headers: Array<[string, string]>,
  url: string,
): string => {
  const contentDisposition = headers.find(
    ([key]) => key.toLowerCase() === "content-disposition",
  )?.[1];

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
    );
    if (filenameMatch?.[1]) {
      return filenameMatch[1].replace(/['"]/g, "");
    }
  }

  // Extract filename from URL as fallback
  try {
    const urlPath = new URL(url).pathname;
    const fileName = urlPath.split("/").pop() || "download";
    return fileName.includes(".") ? fileName : "download";
  } catch {
    return "download";
  }
};
