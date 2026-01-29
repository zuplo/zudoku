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

export const formatDurationInterval = (iso: string): string => {
  try {
    const d = parse(iso);
    if (d.years === 1) return "yearly";
    if (d.years && d.years > 1) return `every ${d.years} years`;
    if (d.months === 1) return "monthly";
    if (d.months && d.months > 1) return `every ${d.months} months`;
    if (d.weeks === 1) return "weekly";
    if (d.weeks && d.weeks > 1) return `every ${d.weeks} weeks`;
    if (d.days === 1) return "daily";
    if (d.days && d.days > 1) return `every ${d.days} days`;
    return iso;
  } catch {
    return iso;
  }
};
