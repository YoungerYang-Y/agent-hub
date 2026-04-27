import { describe, expect, test } from "vitest";
import { normalizeCliCommand } from "../src/core/command-aliases.js";

describe("CLI command aliases", () => {
  test("maps skills-style add commands to install", () => {
    expect(normalizeCliCommand("add", "codex", ["--dry-run"])).toEqual({
      command: "install",
      target: "codex",
      flags: ["--dry-run"],
    });
  });
});
