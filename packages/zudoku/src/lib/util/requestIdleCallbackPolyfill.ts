const root = globalThis;

if (!root.requestIdleCallback || !root.cancelIdleCallback) {
  root.requestIdleCallback = (cb: IdleRequestCallback) => setTimeout(cb, 1);
  root.cancelIdleCallback = clearTimeout;
}
