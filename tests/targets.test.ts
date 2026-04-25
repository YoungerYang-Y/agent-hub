import { describe, expect, test } from "vitest";
import { expandTargetSelection, runForTargetSelection } from "../src/commands/targets.js";

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
});
