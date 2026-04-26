import { describe, expect, test } from "vitest";
import { join } from "node:path";
import { expandTargetSelection, resolveConfigDirForTargetSelection, runForTargetSelection } from "../src/commands/targets.js";

describe("target selection", () => {
  test("expands all to every supported target", () => {
    expect(expandTargetSelection("all").map((adapter) => adapter.id)).toEqual(["codex", "kiro", "claude-code"]);
  });

  test("expands a concrete target to that target only", () => {
    expect(expandTargetSelection("kiro").map((adapter) => adapter.id)).toEqual(["kiro"]);
  });

  test("runs every target and reports aggregate failure", () => {
    const output: string[] = [];
    const result = runForTargetSelection("all", (adapter) => {
      output.push(adapter.id);
      if (adapter.id === "kiro") throw new Error("kiro failed");
    });

    expect(output).toEqual(["codex", "kiro", "claude-code"]);
    expect(result.failed).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.target).toBe("kiro");
  });

  test("resolves target-specific config directories for all target selection", () => {
    const base = join(process.cwd(), ".tmp-tests", "target-config-base");
    const resolved = expandTargetSelection("all").map((adapter) => [
      adapter.id,
      resolveConfigDirForTargetSelection("all", base, adapter),
    ]);

    expect(resolved).toEqual([
      ["codex", join(base, "codex")],
      ["kiro", join(base, "kiro")],
      ["claude-code", join(base, "claude-code")],
    ]);
  });

  test("keeps explicit config directory unchanged for single target selection", () => {
    const base = join(process.cwd(), ".tmp-tests", "single-config");
    const [adapter] = expandTargetSelection("codex");

    expect(resolveConfigDirForTargetSelection("codex", base, adapter!)).toBe(base);
  });
});
