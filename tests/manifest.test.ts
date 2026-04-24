import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadRegistries, validateResource } from "../src/core/manifest.js";

describe("manifest loading", () => {
  test("loads resources from all registry files", () => {
    const root = makeRegistryRoot();
    mkdirSync(join(root, "content/skills/demo"), { recursive: true });
    writeRegistry(root, "skills", [
      {
        id: "demo",
        type: "skill",
        source: "content/skills/demo",
        targets: ["codex"],
        default: true,
        description: "Demo skill",
      },
    ]);

    const resources = loadRegistries(root);

    expect(resources).toHaveLength(1);
    expect(resources[0]?.id).toBe("demo");
  });

  test("rejects resources with missing required fields", () => {
    const issues = validateResource({ id: "missing-source", type: "skill" }, "registry/skills.json", "/tmp/root");

    expect(issues).toContainEqual(expect.objectContaining({ level: "error" }));
  });

  test("reports missing source paths", () => {
    const issues = validateResource(
      {
        id: "missing",
        type: "skill",
        source: "content/skills/missing",
        targets: ["codex"],
        default: true,
        description: "Missing",
      },
      "registry/skills.json",
      "/tmp/root",
    );

    expect(issues.some((issue) => issue.message.includes("source path does not exist"))).toBe(true);
  });
});

function makeRegistryRoot(): string {
  const root = join(process.cwd(), ".tmp-tests", `manifest-${Date.now()}-${Math.random()}`);
  mkdirSync(join(root, "registry"), { recursive: true });
  writeRegistry(root, "skills", []);
  writeRegistry(root, "prompts", []);
  writeRegistry(root, "hooks", []);
  writeRegistry(root, "agents", []);
  return root;
}

function writeRegistry(root: string, name: string, value: unknown): void {
  writeFileSync(join(root, "registry", `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
}
