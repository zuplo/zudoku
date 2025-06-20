import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const openEditor = async (initialValue: string) => {
  return new Promise((resolve, reject) => {
    const tempFile = join(tmpdir(), `zudoku-example-${Date.now()}.json`);
    const initialContent = JSON.stringify(initialValue, null, 2);

    // Write initial content to temp file
    fs.writeFile(tempFile, initialContent, "utf-8")
      .then(() => {
        // Determine the editor to use
        const editor = process.env.EDITOR || process.env.VISUAL || "nano";

        const child = spawn(editor, [tempFile], {
          stdio: "inherit",
          shell: true,
        });

        child.on("close", async (code) => {
          try {
            // Read the file content regardless of exit code
            const content = await fs.readFile(tempFile, "utf-8");

            // Clean up temp file
            await fs.unlink(tempFile);

            // Check if the content was actually modified
            if (content.trim() === initialContent.trim()) {
              // Content wasn't changed, treat as cancellation
              // eslint-disable-next-line no-console
              console.log("Content unchanged, treating as cancellation");
              reject(new Error("Editor was closed without saving"));
              return;
            }

            // Parse the modified content
            const parsed = JSON.parse(content);
            // eslint-disable-next-line no-console
            console.log(
              "Editor returned custom value:",
              JSON.stringify(parsed, null, 2),
            );
            resolve(parsed);
          } catch (error) {
            // Clean up temp file
            try {
              await fs.unlink(tempFile);
            } catch {
              // Ignore cleanup errors
            }

            if (error instanceof SyntaxError) {
              reject(new Error("Invalid JSON in editor"));
            } else {
              reject(error);
            }
          }
        });

        child.on("error", async (error) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch {
            // Ignore cleanup errors
          }
          reject(new Error(`Failed to open editor: ${error.message}`));
        });
      })
      .catch(reject);
  });
};
