import { Fragment, type ReactNode } from "react";

type PathParamProps = {
  name: string;
  index: number;
  originalValue?: string;
};

export const PathRenderer = ({
  path,
  renderParam,
}: {
  path: string;
  renderParam: (props: PathParamProps) => ReactNode;
}) =>
  path.split("/").map((part, i, arr) => {
    const matches = Array.from(part.matchAll(/{([^}]+)}/g));
    const elements: ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, matchIndex) => {
      const [originalValue, name] = match;
      if (!name) return;
      const startIndex = match.index!;

      if (startIndex > lastIndex) {
        elements.push(part.slice(lastIndex, startIndex));
      }

      elements.push(renderParam({ name, originalValue, index: matchIndex }));

      lastIndex = startIndex + originalValue.length;
    });

    if (lastIndex < part.length) {
      elements.push(part.slice(lastIndex));
    }

    return (
      // eslint-disable-next-line react/no-array-index-key
      <Fragment key={`${part}-${i}`}>
        {elements}
        {i < arr.length - 1 && "/"}
        <wbr />
      </Fragment>
    );
  });
