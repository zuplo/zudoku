const c2n = (c: string) =>
  Math.abs(
    isNaN(parseInt(c))
      ? c.toLowerCase().charCodeAt(0) - 96
      : isNaN(parseInt(c))
        ? 0
        : parseInt(c),
  );
const s2n = (s: string) =>
  s.length > 1
    ? parseInt(s.split("").reduce((a, c) => `${c2n(a) + c2n(c)}`))
    : c2n(s);

export const pastellize = (
  s: string,
  options: {
    saturation?: number;
    lightness?: number;
  } = {},
) => {
  const hue = (3 * s2n(s) + 2 * s2n(s) + s2n(s)) % 360;
  const { saturation = 75, lightness = 60 } = options;

  return `${hue}deg ${saturation}% ${lightness}%`;
};
