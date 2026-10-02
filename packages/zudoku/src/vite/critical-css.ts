import BeastiesModule from "beasties";

const Beasties =
  typeof BeastiesModule === "function"
    ? BeastiesModule
    : BeastiesModule.default;

const FAKE_ORIGIN = "https://zudoku.invalid";
const DARK_SELECTOR = /(?:^|[^a-zA-Z0-9_-])\.dark(?:$|[^a-zA-Z0-9_-])/;

const isSelfContainedUrl = (url: string) =>
  url.startsWith("/") ||
  url.startsWith("#") ||
  /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url) ||
  /^(?:var|env)\(/i.test(url);

const decodeCssEscapes = (value: string) =>
  value.replace(
    /\\(?:([\da-fA-F]{1,6})\s?|\r\n|[\n\r\f]|(.))/g,
    (_match, hex: string | undefined, escaped: string | undefined) => {
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      return escaped ?? "";
    },
  );

const escapeCssString = (value: string, quote: string) =>
  value.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);

const rebaseUrlValue = (value: string, stylesheetHref: string) => {
  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? "";
  const trimmed = value.trim();

  if (!trimmed) return value;

  const quote =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed[0]
      : undefined;
  const authoredUrl = quote ? trimmed.slice(1, -1) : trimmed;
  const decodedUrl = decodeCssEscapes(authoredUrl);

  if (!decodedUrl || isSelfContainedUrl(decodedUrl)) return value;

  try {
    const stylesheetUrl = new URL(stylesheetHref, FAKE_ORIGIN);
    const resolvedUrl = new URL(decodedUrl, stylesheetUrl);
    const rebasedUrl =
      resolvedUrl.origin === FAKE_ORIGIN
        ? `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
        : resolvedUrl.href;
    const outputQuote = quote ?? '"';
    const serializedUrl = `${outputQuote}${escapeCssString(
      rebasedUrl,
      outputQuote,
    )}${outputQuote}`;

    return `${leadingWhitespace}${serializedUrl}${trailingWhitespace}`;
  } catch {
    return value;
  }
};

export const rebaseCssUrls = (css: string, stylesheetHref: string) => {
  let output = "";
  let index = 0;

  while (index < css.length) {
    if (css.startsWith("/*", index)) {
      const commentEnd = css.indexOf("*/", index + 2);
      const end = commentEnd === -1 ? css.length : commentEnd + 2;
      output += css.slice(index, end);
      index = end;
      continue;
    }

    const character = css[index];
    if (character === '"' || character === "'") {
      const quote = character;
      let end = index + 1;

      while (end < css.length) {
        if (css[end] === "\\") {
          end += 2;
          continue;
        }
        if (css[end] === quote) {
          end++;
          break;
        }
        end++;
      }

      output += css.slice(index, end);
      index = end;
      continue;
    }

    const previousCharacter = index === 0 ? undefined : css[index - 1];
    const isUrlFunction =
      css.slice(index, index + 4).toLowerCase() === "url(" &&
      !previousCharacter?.match(/[a-zA-Z\d_-]/);

    if (!isUrlFunction) {
      output += character;
      index++;
      continue;
    }

    const valueStart = index + 4;
    let end = valueStart;
    let depth = 1;
    let quote: string | undefined;

    while (end < css.length && depth > 0) {
      const current = css[end];

      if (current === "\\") {
        end += 2;
        continue;
      }
      if (quote) {
        if (current === quote) quote = undefined;
        end++;
        continue;
      }
      if (current === '"' || current === "'") {
        quote = current;
        end++;
        continue;
      }
      if (current === "(") depth++;
      if (current === ")") depth--;
      end++;
    }

    if (depth !== 0) {
      output += css.slice(index);
      break;
    }

    const valueEnd = end - 1;
    output += `${css.slice(index, valueStart)}${rebaseUrlValue(
      css.slice(valueStart, valueEnd),
      stylesheetHref,
    )})`;
    index = end;
  }

  return output;
};

class ZudokuBeasties extends Beasties {
  override async getCssAsset(href: string, style: Node) {
    const css = await super.getCssAsset(href, style);
    return css ? rebaseCssUrls(css, href) : css;
  }

  // Beasties' swap mode normally uses an inline onload handler, which strict
  // script-src-attr policies reject. Keep its preload + noscript structure,
  // but let entry.client activate the full stylesheet after first paint.
  embedFetchedStylesheet(
    data: {
      link: {
        removeAttribute: (name: string) => void;
        setAttribute: (name: string, value: string) => void;
      };
    },
    document: unknown,
  ) {
    const prototype = Beasties.prototype as unknown as {
      embedFetchedStylesheet: (
        this: ZudokuBeasties,
        data: {
          link: {
            removeAttribute: (name: string) => void;
            setAttribute: (name: string, value: string) => void;
          };
        },
        document: unknown,
      ) => unknown;
    };
    const result = prototype.embedFetchedStylesheet.call(this, data, document);
    data.link.removeAttribute("onload");
    data.link.setAttribute("data-zudoku-deferred-stylesheet", "");
    return result;
  }
}

type CriticalCssProcessorOptions = {
  assetsPath: string;
  publicPath: string;
};

export const createCriticalCssProcessor = ({
  assetsPath,
  publicPath,
}: CriticalCssProcessorOptions) => {
  const beasties = new ZudokuBeasties({
    path: assetsPath,
    publicPath,
    pruneSource: false,
    reduceInlineStyles: false,
    preload: "swap",
    inlineFonts: true,
    preloadFonts: false,
    // next-themes adds this class before first paint, after the HTML has been
    // prerendered. Keep the dark theme variables in the critical stylesheet so
    // a stored or system dark preference never flashes the light palette.
    allowRules: [DARK_SELECTOR],
    logLevel: "silent",
  });

  return (html: string) => beasties.process(html);
};
