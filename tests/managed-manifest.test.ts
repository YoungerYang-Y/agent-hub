import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { collectManagedStatuses, type ManagedManifest } from "../src/core/managed-manifest.js";
import { hashPath } from "../src/core/hash.js";
import type { HubResource } from "../src/core/manifest.js";

describe("managed manifest lifecycle", () => {
  test("reports current, missing, drifted, and stale managed resources", () => {
    const fixture = makeManagedFixture();
    const currentHash = hashPath(join(fixture.root, "content/skills/current"));
    const driftHash = hashPath(join(fixture.root, "content/skills/drifted"));
    writeFileSync(join(fixture.configDir, "skills/drifted/SKILL.md"), "# changed locally\n");

    const manifest: ManagedManifest = {
      version: 1,
      updatedAt: "2026-04-25T00:00:00.000Z",
      resources: [
        managed("current", "content/skills/current", "skills/current", currentHash),
        managed("missing", "content/skills/missing", "skills/missing", "missing-hash"),
        managed("drifted", "content/skills/drifted", "skills/drifted", driftHash),
        managed("old", "content/skills/old", "skills/old", "old-hash"),
      ],
    };

    const statuses = collectManagedStatuses({
      manifest,
      registryResources: [
        resource("current", "content/skills/current"),
        resource("missing", "content/skills/missing"),
        resource("drifted", "content/skills/drifted"),
      ],
      target: "codex",
      configDir: fixture.configDir,
      repoRoot: fixture.root,
    });

    expect(statuses.map((status) => [status.id, status.destinationState, status.hashState, status.registryState])).toEqual([
      ["current", "present", "current", "current"],
      ["missing", "missing", "destination-missing", "current"],
      ["drifted", "present", "drifted", "current"],
      ["old", "missing", "source-missing", "stale"],
    ]);
  });
});

function makeManagedFixture(): { root: string; configDir: string } {
  const root = join(process.cwd(), ".tmp-tests", `managed-${Date.now()}-${Math.random()}`);
  const configDir = join(root, "target");
  for (const id of ["current", "missing", "drifted"]) {
    mkdirSync(join(root, `content/skills/${id}`), { recursive: true });
    writeFileSync(join(root, `content/skills/${id}/SKILL.md`), `# ${id}\n`);
  }
  for (const id of ["current", "drifted"]) {
    mkdirSync(join(configDir, `skills/${id}`), { recursive: true });
    writeFileSync(join(configDir, `skills/${id}/SKILL.md`), `# ${id}\n`);
  }
  rmSync(join(configDir, "skills/missing"), { recursive: true, force: true });
  return { root, configDir };
}

function managed(id: string, source: string, destination: string, hash: string): ManagedManifest["resources"][number] {
  return {
    id,
    type: "skill",
    target: "codex",
    source,
    destination,
    hash,
    updatedAt: "2026-04-25T00:00:00.000Z",
  };
}

function resource(id: string, source: string): HubResource {
  return {
    id,
    type: "skill",
    source,
    targets: ["codex"],
    default: true,
    description: `${id} skill`,
  };
}
