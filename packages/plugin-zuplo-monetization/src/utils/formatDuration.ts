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
    if (d.hours === 1) return "hour";
    if (d.hours && d.hours > 1) return `${d.hours} hours`;
    if (d.minutes === 1) return "minute";
    if (d.minutes && d.minutes > 1) return `${d.minutes} minutes`;
    if (d.seconds === 1) return "second";
    if (d.seconds && d.seconds > 1) return `${d.seconds} seconds`;
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
    if (d.hours === 1) return "hourly";
    if (d.hours && d.hours > 1) return `every ${d.hours} hours`;
    if (d.minutes === 1) return "every minute";
    if (d.minutes && d.minutes > 1) return `every ${d.minutes} minutes`;
    if (d.seconds === 1) return "every second";
    if (d.seconds && d.seconds > 1) return `every ${d.seconds} seconds`;
    return iso;
  } catch {
    return iso;
  }
};

/**
 * Returns an adjective form suitable for possessive context
 * e.g. "your monthly quota", "your weekly limit".
 * Falls back to "billing period" for multi-unit cadences
 * or sub-hour units where the adjective form is grammatically awkward
 * (e.g. "every 3 months", "every 5 minutes").
 */
export const formatDurationAdjective = (iso: string): string => {
  try {
    const d = parse(iso);
    if (d.years === 1) return "yearly";
    if (d.months === 1) return "monthly";
    if (d.weeks === 1) return "weekly";
    if (d.days === 1) return "daily";
    if (d.hours === 1) return "hourly";
    return "billing period";
  } catch {
    return "billing period";
  }
};
