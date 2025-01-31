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
}) => {
  let paramIndex = 0;
  return path.split("/").map((part, i, arr) => {
    const matches = Array.from(part.matchAll(/{([^}]+)}/g));
    const elements: ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      const [originalValue, name] = match;
      if (!name) return;
      const startIndex = match.index!;

      if (startIndex > lastIndex) {
        elements.push(
          <Fragment key={`text-${lastIndex}-${startIndex}`}>
            {part.slice(lastIndex, startIndex)}
          </Fragment>,
        );
      }

      elements.push(
        <Fragment key={`param-${name}`}>
          {renderParam({ name, originalValue, index: paramIndex++ })}
        </Fragment>,
      );

      lastIndex = startIndex + originalValue.length;
    });

    if (lastIndex < part.length) {
      elements.push(
        <Fragment key={`text-${lastIndex}-${part.length}`}>
          {part.slice(lastIndex)}
        </Fragment>,
      );
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
};
