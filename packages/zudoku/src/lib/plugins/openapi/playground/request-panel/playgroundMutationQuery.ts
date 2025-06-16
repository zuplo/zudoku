import { PlaygroundForm } from "../Playground.js";

export const playgroundMutationQuery = async (data: PlaygroundForm) => {
      const start = performance.now();

      const headers = Object.fromEntries([
        ...data.headers
          .filter((h) => h.name && h.active)
          .map((header) => [header.name, header.value]),
      ]);

      const request = new Request(
        createUrl(server ?? selectedServer, url, data),
        {
          method: method.toUpperCase(),
          headers,
          body: data.body ? data.body : undefined,
        },
      );

      if (data.identity !== NO_IDENTITY) {
        await identities.data
          ?.find((i) => i.id === data.identity)
          ?.authorizeRequest(request);
      }

      const warningTimeout = setTimeout(
        () => setShowLongRunningWarning(true),
        3210,
      );
      abortControllerRef.current = new AbortController();

      abortControllerRef.current.signal.addEventListener("abort", () => {
        clearTimeout(warningTimeout);
      });

      try {
        const response = await fetch(request, {
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(warningTimeout);
        setShowLongRunningWarning(false);

        const time = performance.now() - start;
        const url = new URL(request.url);
        const responseHeaders = Array.from(response.headers.entries());
        const contentType = response.headers.get("content-type") || "";
        const isBinary = isBinaryContentType(contentType);

        let body = "";
        let blob: Blob | undefined;
        let fileName: string | undefined;

        if (isBinary) {
          blob = await response.blob();
          fileName = extractFileName(responseHeaders, request.url);
          body = `Binary content (${contentType})`;
        } else {
          body = await response.text();
        }

        const responseSize = response.headers.get("content-length");

        return {
          status: response.status,
          headers: responseHeaders,
          size: responseSize ? parseInt(responseSize) : body.length,
          body,
          time,
          isBinary,
          fileName,
          blob,
          request: {
            method: request.method.toUpperCase(),
            url: request.url,
            headers: [
              ["Host", url.host],
              ["User-Agent", "Zudoku Playground"],
              ...Array.from(request.headers.entries()),
            ],
            body: data.body ? data.body : undefined,
          },
        } satisfies PlaygroundResult;
      } catch (error) {
        clearTimeout(warningTimeout);
        setShowLongRunningWarning(false);
        if (error instanceof TypeError) {
          throw new Error(
            "The request failed, possibly due to network issues or CORS policy.",
          );
        } else {
          throw error;
        }
      }
    },
  })