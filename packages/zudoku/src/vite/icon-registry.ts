import { iconVirtualId, parseIconName } from "../lib/util/iconName.js";

/**
 * Collects icon names and emits side-effect imports for their virtual modules.
 * Names are normalized to canonical `prefix:name` ids to avoid duplicate imports.
 */
export class IconRegistry {
  #ids = new Set<string>();

  constructor(names?: Iterable<string>) {
    for (const name of names ?? []) {
      this.add(name);
    }
  }

  add(name: string): this {
    this.#ids.add(parseIconName(name).id);
    return this;
  }

  get size(): number {
    return this.#ids.size;
  }

  toImports = () =>
    Array.from(this.#ids)
      .map((id) => `import ${JSON.stringify(iconVirtualId(id))};`)
      .join("\n");
}
