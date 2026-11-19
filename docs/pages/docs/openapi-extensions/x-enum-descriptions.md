---
title: x-enum-descriptions
sidebar_icon: list
---

Use `x-enum-descriptions` to explain what each value of an `enum` means. Zudoku lists the
descriptions next to their values wherever the enum is shown: in request and response schemas,
object properties, and parameters. Without it, readers see the values only.

Zudoku accepts both `x-enum-descriptions` and `x-enumDescriptions`. If a schema sets both, the
camelCase `x-enumDescriptions` takes precedence.

## Location

The extension is added at the **Schema Object** level, next to the `enum` it describes. For an
array, add it to the `items` schema. For a parameter, add it to the parameter's `schema`.

| Option                                        | Type                   | Description                                                     |
| --------------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| `x-enum-descriptions` or `x-enumDescriptions` | `object` or `string[]` | A description for each enum value, in one of the formats below. |

## Formats

### Map of values to descriptions

Use an object whose keys are enum values and whose values are descriptions.

```yaml
status:
  type: string
  enum: [CREATED, IN_TRANSIT, DELIVERED, EXCEPTION]
  x-enum-descriptions:
    CREATED: Manifest logged and cargo sealed in the stasis bay, awaiting launch clearance.
    IN_TRANSIT: Cargo is aboard a freighter, currently in warp between waypoints.
    DELIVERED: Docked at the destination port and signed for by the recipient.
    EXCEPTION: Delayed by an anomaly such as an ion storm, customs hold or quantum drift.
```

### Map nested under `values`

Some generators wrap the same map in a `values` property. Zudoku reads it the same way.

```yaml
status:
  type: string
  enum: [CREATED, IN_TRANSIT, DELIVERED, EXCEPTION]
  x-enum-descriptions:
    values:
      CREATED: Manifest logged and cargo sealed in the stasis bay.
      IN_TRANSIT: Cargo is aboard a freighter, currently in warp.
      DELIVERED: Docked at the destination port and signed for.
      EXCEPTION: Delayed by an anomaly such as an ion storm.
```

### Array aligned with `enum`

Use an array of strings where each entry describes the `enum` value at the same position. Tools such
as openapi-generator emit this format.

```yaml
status:
  type: string
  enum: [CREATED, IN_TRANSIT, DELIVERED, EXCEPTION]
  x-enum-descriptions:
    - Manifest logged and cargo sealed in the stasis bay.
    - Cargo is aboard a freighter, currently in warp.
    - Docked at the destination port and signed for.
    - Delayed by an anomaly such as an ion storm.
```

Keep the array in the same order as `enum`. Zudoku pairs entries by position, ignores empty entries,
and ignores entries beyond the length of `enum`.

## Behavior

- A value without a description is still listed in the enum, with an empty description.
- Entries that aren't strings are ignored.
- If no usable descriptions remain, Zudoku shows the plain list of enum values.

## Related

- [`x-display-name`](./x-display-name) — set a friendlier label for a tag
