import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("package metadata", () => {
  test("does not claim a standalone npx skills package", () => {
    const root = process.cwd();
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as { bin?: Record<string, string> };
    const readme = readFileSync(join(root, "README.md"), "utf-8");

    expect(packageJson.bin).not.toHaveProperty("skills");
    expect(readme).not.toContain("npx skills add");
    expect(readme).toContain("npx agent-hub add");
  });
});
