import { describe, expect, test } from "vitest";
import { createCodexAdapter } from "../src/adapters/codex.js";
import { createKiroAdapter } from "../src/adapters/kiro.js";

describe("adapter path resolution", () => {
  test("uses explicit config directory before environment defaults", () => {
    const adapter = createCodexAdapter();

    expect(adapter.resolveConfigDir({ configDir: "/tmp/custom-codex" })).toBe("/tmp/custom-codex");
  });

  test("uses target environment variable when present", () => {
    const original = process.env.KIRO_HOME;
    process.env.KIRO_HOME = "/tmp/kiro-home";
    const adapter = createKiroAdapter();

    expect(adapter.resolveConfigDir({})).toBe("/tmp/kiro-home");

    if (original === undefined) delete process.env.KIRO_HOME;
    else process.env.KIRO_HOME = original;
  });
});
