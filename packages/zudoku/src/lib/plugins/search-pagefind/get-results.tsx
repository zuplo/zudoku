import type { AuthState } from "../../authentication/state.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import type { PagefindOptions } from "./index.js";
import type { PagefindSearchFragment, PagefindSearchResults } from "./types.js";

export const getResults = async ({
  search,
  options,
  auth,
  context,
}: {
  search: PagefindSearchResults;
  options: PagefindOptions;
  auth: AuthState;
  context: ZudokuContext;
}) => {
  const maxResults = options.maxResults ?? 10;
  const transformFn = options.transformResults ?? (() => true);

  const transformedResults: PagefindSearchFragment[] = [];

  const generator = searchResultGenerator({
    search,
    transformFn,
    auth,
    context,
  });

  for await (const result of generator) {
    transformedResults.push(result);
    if (transformedResults.length >= maxResults) break;
  }

  return transformedResults;
};

async function* searchResultGenerator({
  search,
  transformFn,
  auth,
  context,
}: {
  search: PagefindSearchResults;
  transformFn: NonNullable<PagefindOptions["transformResults"]>;
  auth: AuthState<unknown>;
  context: ZudokuContext;
}) {
  const batchSize = 5;
  let processedCount = 0;

  while (processedCount < search.results.length) {
    const batch = search.results.slice(
      processedCount,
      processedCount + batchSize,
    );
    processedCount += batch.length;

    const batchData = await Promise.all(batch.map((result) => result.data()));

    for (const result of batchData) {
      const transformed = transformFn({ result, auth, context });

      if (transformed === false) {
        // Skip this result
        continue;
      } else if (transformed === true || transformed == null) {
        // Keep the original result
        yield result;
      } else {
        // Return the transformed result
        yield transformed;
      }
    }
  }
}
