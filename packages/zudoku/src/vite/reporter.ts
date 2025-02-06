// Source: https://github.com/vitejs/vite/blob/e1fa067e65a11e422b6fd94d4ce916a675ebb9a5/packages/vite/src/node/plugins/reporter.ts#L49

export function writeLine(output: string) {
  clearLine();
  if (output.length < process.stdout.columns) {
    process.stdout.write(output);
  } else {
    process.stdout.write(output.substring(0, process.stdout.columns - 1));
  }
}

function clearLine() {
  const tty = process.stdout.isTTY && !process.env.CI;
  if (tty) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function throttle(fn: Function) {
  let timerHandle: NodeJS.Timeout | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    if (timerHandle) return;
    fn(...args);
    timerHandle = setTimeout(() => {
      timerHandle = null;
    }, 100);
  };
}
