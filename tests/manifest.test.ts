import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadRegistries, selectResourcesForTarget, validateResource, type HubResource } from "../src/core/manifest.js";

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

  test("selects default resources for a target by default", () => {
    const selected = selectResourcesForTarget(selectionResources(), "codex", {
      allResources: false,
    });

    expect(selected.map((resource) => resource.id)).toEqual(["default-skill", "default-prompt"]);
  });

  test("selects a non-default resource by id", () => {
    const selected = selectResourcesForTarget(selectionResources(), "codex", {
      allResources: false,
      resourceId: "optional-skill",
    });

    expect(selected.map((resource) => resource.id)).toEqual(["optional-skill"]);
  });

  test("filters selected resources by type", () => {
    const selected = selectResourcesForTarget(selectionResources(), "codex", {
      allResources: false,
      resourceType: "skill",
    });

    expect(selected.map((resource) => resource.id)).toEqual(["default-skill"]);
  });

  test("all resources includes non-default resources and still filters by type", () => {
    const selected = selectResourcesForTarget(selectionResources(), "codex", {
      allResources: true,
      resourceType: "skill",
    });

    expect(selected.map((resource) => resource.id)).toEqual(["default-skill", "optional-skill"]);
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

function selectionResources(): HubResource[] {
  return [
    resource("default-skill", "skill", true, ["codex", "kiro"]),
    resource("optional-skill", "skill", false, ["codex"]),
    resource("default-prompt", "prompt", true, ["codex"]),
    resource("claude-only", "skill", true, ["claude-code"]),
  ];
}

function resource(id: string, type: HubResource["type"], defaultInstall: boolean, targets: HubResource["targets"]): HubResource {
  return {
    id,
    type,
    source: `content/${type}s/${id}`,
    targets,
    default: defaultInstall,
    description: id,
  };
}
