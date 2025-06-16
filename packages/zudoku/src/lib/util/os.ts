export function getOS(): "apple" | "linux" | "unix" | "windows" | undefined {
  const notFound = -1;
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf("win") !== notFound) {
    return "windows";
  } else if (userAgent.indexOf("mac") !== notFound) {
    return "apple";
  } else if (userAgent.indexOf("linux") !== notFound) {
    return "linux";
  } else if (userAgent.indexOf("x11") !== notFound) {
    return "unix";
  }
  return;
}

export function isAppleDevice(): boolean {
  return getOS() === "apple";
}
