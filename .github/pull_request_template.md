<!--
Reviewers skim. Show the change, don't describe it. The whole description
should fit on one screen, not counting diagrams and snippets. Don't restate the
diff, don't list files, no "This PR..." preamble. Delete any optional section
that doesn't apply, and delete these comments.

Show Before and After in whatever form makes the difference clearest, and
combine forms when that helps. ASCII (```text) and Mermaid (```mermaid) both
render.

| Change                                     | Clearest form (combine as needed)            |
| ------------------------------------------ | -------------------------------------------- |
| Config schema or plugin API                | TypeScript type diff (```diff)               |
| Build, render, or request flow             | Flowchart or sequence diagram                |
| Component or module boundaries             | Box diagram (`flowchart` with subgraphs)     |
| Config users write                         | Snippets in ## Examples                      |
| UI                                         | Screenshots                                  |

Rules:
- Use the same form and layout for Before and After, so the difference is the
  only thing that moves. A single ```diff can cover both.
- Mark what changed: (new), (removed), (changed), or diff + / -.
- Show only the part that changed and its immediate neighbours.
- Trivial changes (dependency bumps, typos, test-only) need nothing here:
  write "N/A".
-->

**Summary:** <what changed, one line>. **Risk:** low | medium | high. <issue link>

## Why

<!-- 1-3 sentences: the problem and who it hurts. -->

## Before

<!-- The old behavior, in the form the table above suggests. For example:

```ts
type NavigationItem = {
  label: string;
  icon?: string;
};
```
-->

## After

<!-- Same form and layout as Before, with the change marked. For example:

```diff
 type NavigationItem = {
   label: string;
-  icon?: string;
+  icon?: string | ReactNode;
 };
```
-->

## Examples |

| UI | Screenshots |

Rules:

- Use the same form and layout for Before and After, so the difference is the only thing that moves.
  A single ```diff can cover both.
- Mark what changed: (new), (removed), (changed), or diff + / -.
- Show only the part that changed and its immediate neighbours.
- Trivial changes (dependency bumps, typos, test-only) need nothing here: write "N/A". -->

**Summary:** <what changed, one line>. **Risk:** low | medium | high. <issue link>

## Why

<!-- 1-3 sentences: the problem and who it hurts. -->

## Before

<!-- The old behavior, in the form the table above suggests. -->

```diff
 type NavigationItem = {
   label: string;
-  icon?: string;
 };
```

## After

<!-- Same form and layout as Before. -->

```diff
 type NavigationItem = {
   label: string;
+  icon?: string | ReactNode; // changed
 };
```

## Examples

<!-- Required when the change affects zudoku.config.ts, plugin APIs, the CLI,
rendered output, or error messages. Show before -> after as real snippets.
Delete this section if nothing user-facing changes. -->

## Human review

<!-- Risk-ranked decisions to check while reading the code. One line each.
Don't list files. -->

1. **Decision**: the assumption to check

Skip: <!-- generated or mechanical files a reviewer can scroll past, or "nothing" -->

### Try it

<!-- Numbered steps a reviewer can follow without reading the diff, e.g.
`nx run cosmo-cargo:dev`, the page to open, and what they should see. Write
"N/A" when it can't be exercised by hand, and name the test that covers it. -->

1. ...

## Rollout

<!-- Only for breaking changes: the migration guide and what users must
change. Otherwise delete this section. -->

## Validation

<!-- Bullets: commands run and results, and what they don't prove. -->

## Release notes

<!-- Optional for community contributors; a maintainer will fill it in if
needed. impact: internal or none needs no other fields. A change to a config
option, default, rendered output, CLI behavior, or error message is
impact: user, even when it looks small. -->

```release-notes
impact:               # user | internal | none
type:                 # new | improved | changed | fixed | deprecated | breaking
entry: >
  One sentence a Zudoku user would understand.
details: >
  Before and after, with exact option names and messages.
action: What users need to change in zudoku.config.ts, or "None".
```
