import { parse } from "tinyduration";

export const formatDuration = (iso: string): string => {
  try {
    const d = parse(iso);
    if (d.months === 1) return "month";
    if (d.months && d.months > 1) return `${d.months} months`;
    if (d.years === 1) return "year";
    if (d.years && d.years > 1) return `${d.years} years`;
    if (d.weeks === 1) return "week";
    if (d.weeks && d.weeks > 1) return `${d.weeks} weeks`;
    if (d.days === 1) return "day";
    if (d.days && d.days > 1) return `${d.days} days`;
    return iso;
  } catch {
    return iso;
  }
};
