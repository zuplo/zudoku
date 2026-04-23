import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { parse, stringify } from "yaml";

export const yaml = {
  parse: (input: string) => parse(input) ?? {},
  stringify: (obj: object) => stringify(obj),
};

export const readFrontmatter = async (filePath: string) => {
  const content = await readFile(filePath, "utf-8");
  const normalizedContent = content.replace(/\r\n/g, "\n");
  return matter(normalizedContent, { engines: { yaml } });
};
