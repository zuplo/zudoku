---
title: Vite Config
---

Zuplo is built on top of [Vite](https://vitejs.dev/) and can be customized using a [Vite configuration file](https://vitejs.dev/config/) if advanced functionality is required.

Not all configurations are supported in Zudoku, but common tasks like adding plugins will generally work as expected. Simply create a `vite.config.ts` file in the root of your project and set the configuration options as needed.

Zudoku will automatically pick up the configuration file and will use it to augment the built-in configuration.

You can find an [example project](https://github.com/zuplo/zudoku/tree/main/examples/with-vite-config) on GitHub that demonstrates how to use a custom Vite configuration with Zudoku.
