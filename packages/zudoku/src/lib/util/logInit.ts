import log from "loglevel";

log.setDefaultLevel("silent");

if (import.meta.env.DEV) {
  log.setLevel("debug");
} else if (localStorage.getItem("ENABLE_DEBUG_LOGS")) {
  log.setLevel("debug");
}
