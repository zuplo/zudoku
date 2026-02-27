export const slugify = (str: string) =>
  str
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export type CountableSlugify = (str: string) => string;

export const slugifyWithCounter = (): CountableSlugify => {
  const counts = new Map<string, number>();

  return (str) => {
    const base = slugify(str);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
};
