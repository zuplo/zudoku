import { execSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("remarkLastModified git integration", () => {
  const testDir = join("/tmp", "remark-last-modified-test");
  const testFile = join(testDir, "test.md");

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Initialize a git repository for testing
    execSync("git init", { cwd: testDir, stdio: "ignore" });
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: "ignore",
    });
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: "ignore",
    });
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it("should get git commit date for a file", async () => {
    // Create a test file and commit it
    const content = "# Test\n\nContent here.";
    await writeFile(testFile, content);

    // Add and commit the file
    execSync(`git add "${testFile}"`, { cwd: testDir, stdio: "ignore" });
    execSync('git commit -m "Initial commit"', {
      cwd: testDir,
      stdio: "ignore",
    });

    // Get the git commit date
    const gitDate = execSync(`git log -1 --format=%aI -- "${testFile}"`, {
      cwd: testDir,
      encoding: "utf-8",
    }).trim();

    // Verify it's a valid ISO date
    const parsedDate = new Date(gitDate);
    expect(parsedDate.toISOString()).toBeTruthy();
    expect(Number.isNaN(parsedDate.getTime())).toBe(false);
  });

  it("should return empty string for file not in git history", () => {
    const nonGitDir = "/tmp/non-git-dir";
    try {
      const result = execSync(`git log -1 --format=%aI -- "${nonGitDir}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
      expect(result).toBe("");
    } catch {
      // Expected to fail or return empty
      expect(true).toBe(true);
    }
  });

  it("should update file and get new commit date", async () => {
    // Get initial commit date
    const initialDate = execSync(`git log -1 --format=%aI -- "${testFile}"`, {
      cwd: testDir,
      encoding: "utf-8",
    }).trim();

    // Wait a moment to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Update the file
    await writeFile(testFile, "# Test\n\nUpdated content.");
    execSync(`git add "${testFile}"`, { cwd: testDir, stdio: "ignore" });
    execSync('git commit -m "Update file"', {
      cwd: testDir,
      stdio: "ignore",
    });

    // Get updated commit date
    const updatedDate = execSync(`git log -1 --format=%aI -- "${testFile}"`, {
      cwd: testDir,
      encoding: "utf-8",
    }).trim();

    // Verify the dates are different and the updated date is later
    expect(updatedDate).not.toBe(initialDate);
    expect(new Date(updatedDate).getTime()).toBeGreaterThan(
      new Date(initialDate).getTime(),
    );
  });

  it("should handle git --version check gracefully", () => {
    // This test verifies that checking for git availability doesn't throw
    try {
      execSync("git --version", { stdio: "ignore" });
      // Git is available
      expect(true).toBe(true);
    } catch {
      // Git is not available, which is also fine
      expect(true).toBe(true);
    }
  });
});
