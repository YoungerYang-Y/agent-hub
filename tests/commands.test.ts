import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { runStatus } from "../src/commands/status.js";
import { hashPath } from "../src/core/hash.js";
import { managedManifestPath, writeManagedManifest } from "../src/core/managed-manifest.js";

describe("commands", () => {
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
