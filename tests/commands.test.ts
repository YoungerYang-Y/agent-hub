import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { runInstall } from "../src/commands/install.js";
import { runPrune } from "../src/commands/prune.js";
import { runStatus } from "../src/commands/status.js";
import { runUninstall } from "../src/commands/uninstall.js";
import { hashPath } from "../src/core/hash.js";
import { managedManifestPath, writeManagedManifest } from "../src/core/managed-manifest.js";

describe("commands", () => {
  test("install can select a non-default resource by id", () => {
    const fixture = makeCommandFixture("install-resource");
    seedRegistryResource(fixture, "default-skill", "skill", true);
    seedRegistryResource(fixture, "optional-skill", "skill", false);

    const output = captureLogs(() =>
      runInstall(fixture.root, "codex", {
        configDir: fixture.configDir,
        dryRun: true,
        force: false,
        allResources: false,
        resourceId: "optional-skill",
      }),
    );

    expect(output).toContain("optional-skill");
    expect(output).not.toContain("default-skill");
  });

  test("install can select default resources by type", () => {
    const fixture = makeCommandFixture("install-type");
    seedRegistryResource(fixture, "default-skill", "skill", true);
    seedRegistryResource(fixture, "default-prompt", "prompt", true);

    const output = captureLogs(() =>
      runInstall(fixture.root, "codex", {
        configDir: fixture.configDir,
        dryRun: true,
        force: false,
        allResources: false,
        resourceType: "prompt",
      }),
    );

    expect(output).toContain("default-prompt");
    expect(output).not.toContain("default-skill");
  });

  test("install all resources still respects type filters", () => {
    const fixture = makeCommandFixture("install-all-type");
    seedRegistryResource(fixture, "default-skill", "skill", true);
    seedRegistryResource(fixture, "optional-skill", "skill", false);
    seedRegistryResource(fixture, "optional-prompt", "prompt", false);

    const output = captureLogs(() =>
      runInstall(fixture.root, "codex", {
        configDir: fixture.configDir,
        dryRun: true,
        force: false,
        allResources: true,
        resourceType: "skill",
      }),
    );

    expect(output).toContain("default-skill");
    expect(output).toContain("optional-skill");
    expect(output).not.toContain("optional-prompt");
  });

  test("status reports an empty managed resource set", () => {
    const fixture = makeCommandFixture("status-empty");

    const output = captureLogs(() => runStatus(fixture.root, "codex", { configDir: fixture.configDir }));

    expect(output).toContain("No managed resources for Codex");
  });

  test("status reports managed resource state", () => {
    const fixture = makeCommandFixture("status-current");
    const source = join(fixture.root, "content/skills/demo");
    const destination = join(fixture.configDir, "skills/demo");
    mkdirSync(source, { recursive: true });
    mkdirSync(destination, { recursive: true });
    writeFileSync(join(source, "SKILL.md"), "# demo\n");
    writeFileSync(join(destination, "SKILL.md"), "# demo\n");
    writeManagedManifest(managedManifestPath(fixture.configDir), {
      version: 1,
      updatedAt: "2026-04-25T00:00:00.000Z",
      resources: [{
        id: "demo",
        type: "skill",
        target: "codex",
        source: "content/skills/demo",
        destination: "skills/demo",
        hash: hashPath(destination),
        updatedAt: "2026-04-25T00:00:00.000Z",
      }],
    });
    writeFileSync(join(fixture.root, "registry/skills.json"), JSON.stringify([{
      id: "demo",
      type: "skill",
      source: "content/skills/demo",
      targets: ["codex"],
      default: true,
      description: "Demo skill",
    }]));

    const output = captureLogs(() => runStatus(fixture.root, "codex", { configDir: fixture.configDir }));

    expect(output).toContain("Managed resources for Codex");
    expect(output).toContain("demo");
    expect(output).toContain("present");
    expect(output).toContain("current");
  });

  test("prune dry-run reports stale managed resources without deleting them", () => {
    const fixture = makeCommandFixture("prune-dry-run");
    seedRegistryResource(fixture, "current", "skill", true);
    seedManagedSkill(fixture, "current");
    seedManagedSkill(fixture, "old");

    const output = captureLogs(() => runPrune(fixture.root, "codex", { configDir: fixture.configDir, dryRun: true }));

    expect(output).toContain("Planned prune");
    expect(output).toContain("old");
    expect(existsSync(join(fixture.configDir, "skills/old/SKILL.md"))).toBe(true);
    expect(readFileSync(managedManifestPath(fixture.configDir), "utf-8")).toContain("\"old\"");
  });

  test("prune removes stale managed resources and keeps current ones", () => {
    const fixture = makeCommandFixture("prune");
    seedRegistryResource(fixture, "current", "skill", true);
    seedManagedSkill(fixture, "current");
    seedManagedSkill(fixture, "old");

    const output = captureLogs(() => runPrune(fixture.root, "codex", { configDir: fixture.configDir, dryRun: false }));

    expect(output).toContain("Pruned 1 stale managed resource");
    expect(existsSync(join(fixture.configDir, "skills/current/SKILL.md"))).toBe(true);
    expect(existsSync(join(fixture.configDir, "skills/old"))).toBe(false);
    const manifest = readFileSync(managedManifestPath(fixture.configDir), "utf-8");
    expect(manifest).toContain("\"current\"");
    expect(manifest).not.toContain("\"old\"");
  });

  test("uninstall dry-run leaves managed files and manifest unchanged", () => {
    const fixture = makeCommandFixture("uninstall-dry-run");
    seedManagedSkill(fixture, "demo");

    const output = captureLogs(() => runUninstall(fixture.root, "codex", { configDir: fixture.configDir, dryRun: true }));

    expect(output).toContain("Planned removal");
    expect(existsSync(join(fixture.configDir, "skills/demo/SKILL.md"))).toBe(true);
    expect(readFileSync(managedManifestPath(fixture.configDir), "utf-8")).toContain("\"demo\"");
  });

  test("uninstall removes managed destinations and manifest entries", () => {
    const fixture = makeCommandFixture("uninstall");
    seedManagedSkill(fixture, "demo");

    const output = captureLogs(() => runUninstall(fixture.root, "codex", { configDir: fixture.configDir, dryRun: false }));

    expect(output).toContain("Removed 1 managed resource");
    expect(existsSync(join(fixture.configDir, "skills/demo"))).toBe(false);
    expect(readFileSync(managedManifestPath(fixture.configDir), "utf-8")).not.toContain("\"demo\"");
  });

  test("uninstall resource filter removes only the selected managed resource", () => {
    const fixture = makeCommandFixture("uninstall-filter");
    seedManagedSkill(fixture, "one");
    seedManagedSkill(fixture, "two");

    captureLogs(() => runUninstall(fixture.root, "codex", { configDir: fixture.configDir, dryRun: false, resourceId: "one" }));

    expect(existsSync(join(fixture.configDir, "skills/one"))).toBe(false);
    expect(existsSync(join(fixture.configDir, "skills/two/SKILL.md"))).toBe(true);
    const manifest = readFileSync(managedManifestPath(fixture.configDir), "utf-8");
    expect(manifest).not.toContain("\"one\"");
    expect(manifest).toContain("\"two\"");
  });
});

function makeCommandFixture(name: string): { root: string; configDir: string } {
  const root = join(process.cwd(), ".tmp-tests", `command-${name}-${Date.now()}-${Math.random()}`);
  const configDir = join(root, "target");
  mkdirSync(join(root, "registry"), { recursive: true });
  mkdirSync(configDir, { recursive: true });
  for (const registry of ["skills", "prompts", "hooks", "agents"]) {
    writeFileSync(join(root, "registry", `${registry}.json`), "[]\n");
  }
  return { root, configDir };
}

function seedRegistryResource(fixture: { root: string }, id: string, type: "skill" | "prompt", defaultInstall: boolean): void {
  const typeDir = type === "skill" ? "skills" : "prompts";
  const source = join(fixture.root, `content/${typeDir}/${id}`);
  mkdirSync(source, { recursive: true });
  writeFileSync(join(source, type === "skill" ? "SKILL.md" : `${id}.md`), `# ${id}\n`);
  const registryPath = join(fixture.root, "registry", `${typeDir}.json`);
  const existing = JSON.parse(readFileSync(registryPath, "utf-8")) as unknown[];
  existing.push({
    id,
    type,
    source: `content/${typeDir}/${id}`,
    targets: ["codex"],
    default: defaultInstall,
    description: id,
  });
  writeFileSync(registryPath, `${JSON.stringify(existing, null, 2)}\n`);
}

function captureLogs(fn: () => void): string {
  const originalLog = console.log;
  let output = "";
  console.log = (...args: unknown[]) => {
    output += `${args.join(" ")}\n`;
  };
  try {
    fn();
  }
  finally {
    console.log = originalLog;
  }
  return output;
}

function seedManagedSkill(fixture: { root: string; configDir: string }, id: string): void {
  const source = join(fixture.root, `content/skills/${id}`);
  const destination = join(fixture.configDir, `skills/${id}`);
  mkdirSync(source, { recursive: true });
  mkdirSync(destination, { recursive: true });
  writeFileSync(join(source, "SKILL.md"), `# ${id}\n`);
  writeFileSync(join(destination, "SKILL.md"), `# ${id}\n`);
  const manifestPath = managedManifestPath(fixture.configDir);
  const existing = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf-8")) as { resources?: unknown[] }
    : { version: 1, updatedAt: "2026-04-25T00:00:00.000Z", resources: [] };
  writeManagedManifest(manifestPath, {
    version: 1,
    updatedAt: "2026-04-25T00:00:00.000Z",
    resources: [
      ...existing.resources as never[],
      {
        id,
        type: "skill",
        target: "codex",
        source: `content/skills/${id}`,
        destination: `skills/${id}`,
        hash: hashPath(destination),
        updatedAt: "2026-04-25T00:00:00.000Z",
      },
    ],
  });
}
