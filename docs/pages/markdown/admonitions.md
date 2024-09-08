---
title: Admonitions
sidebar_icon: rectangle-horizontal
---

In addition to the basic Markdown syntax, we have a special admonitions syntax by wrapping text with a set of 3 colons, followed by a label denoting its type.

Example:

```markdown
:::note

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::tip

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::info

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::warning

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::danger

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::
```

:::note

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::tip

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::info

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::warning

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

:::danger

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::

## With title

You can also add a title to the admonition by adding it after the type:

```markdown
:::warning{title="Warning of the day"}

The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men.

:::
```

:::warning{title="Warning of the day"}

The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men.

:::

## Usage with Prettier

If you use Prettier to format your Markdown files, Prettier might auto-format your code to invalid admonition syntax. To avoid this problem, add empty lines around the starting and ending directives. This is also why the examples we show here all have empty lines around the content.

<!-- prettier-ignore -->
```markdown
<!-- Prettier doesn't change this -->

:::note

Hello world

:::

<!-- Prettier changes this -->

:::note 
Hello world 
:::

<!-- to this -->

::: note Hello world:::
```
