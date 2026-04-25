import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { createCodexAdapter } from "../src/adapters/codex.js";
import { planInstall, syncResources } from "../src/core/copy.js";
import type { HubResource } from "../src/core/manifest.js";

describe("copy engine", () => {
  test("plans installation without writing files in dry-run mode", () => {
    const fixture = makeCopyFixture();
    const adapter = createCodexAdapter();

    const plan = planInstall([fixture.resource], adapter, {
      repoRoot: fixture.root,
      configDir: fixture.target,
      dryRun: true,
      force: false,
    });

    expect(plan.operations).toHaveLength(1);
    expect(existsSync(join(fixture.target, "skills/demo/SKILL.md"))).toBe(false);
  });

  test("copies resources and writes a managed manifest", () => {
    const fixture = makeCopyFixture();
    const adapter = createCodexAdapter();

    const result = syncResources([fixture.resource], adapter, {
      repoRoot: fixture.root,
      configDir: fixture.target,
      dryRun: false,
      force: false,
    });

    expect(result.operations).toHaveLength(1);
    expect(readFileSync(join(fixture.target, "skills/demo/SKILL.md"), "utf-8")).toContain("demo");
    expect(readFileSync(join(fixture.target, ".agent-hub-manifest.json"), "utf-8")).toContain("demo");
  });

  test("rejects unmanaged destination conflicts unless forced", () => {
    const fixture = makeCopyFixture();
    mkdirSync(join(fixture.target, "skills/demo"), { recursive: true });
    writeFileSync(join(fixture.target, "skills/demo/SKILL.md"), "local change");
    const adapter = createCodexAdapter();

    let error: unknown;
    try {
      syncResources([fixture.resource], adapter, {
        repoRoot: fixture.root,
        configDir: fixture.target,
        dryRun: false,
        force: false,
      });
    }
    catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toContain("Install conflict");
    expect(message).toContain(join(fixture.target, "skills/demo"));
    expect(message).toContain(join(fixture.target, ".agent-hub-manifest.json"));
    expect(message).toContain("--force");
    expect(message).toContain("--config-dir");
  });
});

function makeCopyFixture(): { root: string; target: string; resource: HubResource } {
  const root = join(process.cwd(), ".tmp-tests", `copy-${Date.now()}-${Math.random()}`);
  const source = join(root, "content/skills/demo");
  const target = join(root, "target");
  mkdirSync(source, { recursive: true });
  mkdirSync(target, { recursive: true });
  writeFileSync(join(source, "SKILL.md"), "# demo\n");
  return {
    root,
    target,
    resource: {
      id: "demo",
      type: "skill",
      source: "content/skills/demo",
      targets: ["codex"],
      default: true,
      description: "Demo skill",
    },
  };
}
