/**
 * Resolve the latest published version of a package from the npm registry.
 *
 * Returns the provided `fallback` when offline or when the registry can't be
 * reached, so scaffolding never fails just because the network is unavailable.
 */
export async function getLatestVersion(
  packageName: string,
  fallback: string,
  isOnline = true,
): Promise<string> {
  if (!isOnline) return fallback;

  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!res.ok) return fallback;

    const data = (await res.json()) as { version?: string };
    return data.version ?? fallback;
  } catch {
    return fallback;
  }
}
