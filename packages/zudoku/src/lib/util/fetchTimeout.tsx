export const fetchTimeout = async (
  input: RequestInfo,
  init?: RequestInit,
  timeout = 5000,
): Promise<Response> => {
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchPromise = fetch(input, { ...init, signal });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    const timer = setTimeout(() => {
      controller.abort("Request timed out");
      reject(new Error("Request timed out"));
    }, timeout);

    void fetchPromise.finally(() => clearTimeout(timer));
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};
