import type { PagefindOptions } from "./index.js";
import type { PagefindSearchFragment, PagefindSearchResults } from "./types.js";

export const getResults = async (
  search: PagefindSearchResults,
  options: PagefindOptions,
) => {
  const maxResults = options.maxResults ?? 10;
  const transformFn = options.transformResults ?? (() => true);

  const transformedResults: PagefindSearchFragment[] = [];

  const generator = searchResultGenerator(search, transformFn);

  for await (const result of generator) {
    transformedResults.push(result);
    if (transformedResults.length >= maxResults) break;
  }

  return transformedResults;
};

async function* searchResultGenerator(
  search: PagefindSearchResults,
  transformFn: NonNullable<PagefindOptions["transformResults"]>,
) {
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
      const transformed = transformFn(result);

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
