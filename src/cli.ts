#!/usr/bin/env node
import { runDoctor } from "./commands/doctor.js";
import { runInstall } from "./commands/install.js";
import { runList } from "./commands/list.js";
import { runStatus } from "./commands/status.js";
import { runUpdate } from "./commands/update.js";
import { repositoryRootFromCli } from "./core/paths.js";

interface ParsedFlags {
  dryRun: boolean;
  force: boolean;
  configDir?: string;
}

const repoRoot = repositoryRootFromCli();
const [, , command, target, ...rawFlags] = process.argv;

try {
  switch (command) {
    case "list":
    case undefined:
      runList(repoRoot);
      break;
    case "install":
      requireTarget(target);
      runInstall(repoRoot, target, parseFlags(rawFlags));
      break;
    case "update":
      requireTarget(target);
      runUpdate(repoRoot, target, parseFlags(rawFlags));
      break;
    case "doctor":
      requireTarget(target);
      runDoctor(repoRoot, target, parseFlags(rawFlags));
      break;
    case "status":
      requireTarget(target);
      runStatus(repoRoot, target, parseFlags(rawFlags));
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function parseFlags(flags: string[]): ParsedFlags {
  const parsed: ParsedFlags = { dryRun: false, force: false };
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === "--dry-run") parsed.dryRun = true;
    else if (flag === "--force") parsed.force = true;
    else if (flag === "--config-dir") {
      const value = flags[index + 1];
      if (!value) throw new Error("--config-dir requires a path");
      parsed.configDir = value;
      index += 1;
    }
    else {
      throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return parsed;
}

function requireTarget(value: string | undefined): asserts value is string {
  if (!value) throw new Error("Target is required. Supported targets: codex, kiro, claude-code");
}

function printHelp(): void {
  console.log(`agent-hub

Usage:
  agent-hub list
  agent-hub doctor <codex|kiro|claude-code> [--config-dir <path>]
  agent-hub status <codex|kiro|claude-code> [--config-dir <path>]
  agent-hub install <codex|kiro|claude-code> [--dry-run] [--force] [--config-dir <path>]
  agent-hub update <codex|kiro|claude-code> [--dry-run] [--force] [--config-dir <path>]
`);
}
