export const formatBillingCycle = (duration: string): string => {
  if (duration === "month") return "monthly";
  if (duration === "year") return "annually";
  if (duration === "week") return "weekly";
  if (duration === "day") return "daily";
  return `every ${duration}`;
};
