/**
 * Format an ISO timestamp with the time of day included, e.g.
 * "Jun 3, 2026, 2:00 PM". Subscriptions can bill on sub-day cadences, so the
 * time is what disambiguates a period's boundaries and the next renewal.
 */
export const formatDateTime = (dateString: string): string =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
