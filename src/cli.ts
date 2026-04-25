#!/usr/bin/env node
import { runDoctor } from "./commands/doctor.js";
import { runInstall } from "./commands/install.js";
import { runList } from "./commands/list.js";
import { runStatus } from "./commands/status.js";
import { runForTargetSelection } from "./commands/targets.js";
import { runUninstall } from "./commands/uninstall.js";
import { runUpdate } from "./commands/update.js";
import type { HubResourceType } from "./core/manifest.js";
import { repositoryRootFromCli } from "./core/paths.js";

interface ParsedFlags {
  dryRun: boolean;
  force: boolean;
  configDir?: string;
  allResources: boolean;
  resourceId?: string;
  resourceType?: HubResourceType;
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
      runForTargets(target, (resolvedTarget) => runInstall(repoRoot, resolvedTarget, parseFlags(rawFlags)));
      break;
    case "update":
      requireTarget(target);
      runForTargets(target, (resolvedTarget) => runUpdate(repoRoot, resolvedTarget, parseFlags(rawFlags)));
      break;
    case "doctor":
      requireTarget(target);
      runForTargets(target, (resolvedTarget) => runDoctor(repoRoot, resolvedTarget, parseFlags(rawFlags)));
      break;
    case "status":
      requireTarget(target);
      runForTargets(target, (resolvedTarget) => runStatus(repoRoot, resolvedTarget, parseFlags(rawFlags)));
      break;
    case "uninstall":
      requireTarget(target);
      runForTargets(target, (resolvedTarget) => runUninstall(repoRoot, resolvedTarget, parseFlags(rawFlags)));
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
  const parsed: ParsedFlags = { dryRun: false, force: false, allResources: false };
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === "--dry-run") parsed.dryRun = true;
    else if (flag === "--force") parsed.force = true;
    else if (flag === "--all") parsed.allResources = true;
    else if (flag === "--config-dir") {
      const value = flags[index + 1];
      if (!value) throw new Error("--config-dir requires a path");
      parsed.configDir = value;
      index += 1;
    }
    else if (flag === "--resource") {
      const value = flags[index + 1];
      if (!value) throw new Error("--resource requires an id");
      parsed.resourceId = value;
      index += 1;
    }
    else if (flag === "--type") {
      const value = flags[index + 1];
      if (!value) throw new Error("--type requires a resource type");
      parsed.resourceType = parseResourceType(value);
      index += 1;
    }
    else {
      throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return parsed;
}

function parseResourceType(value: string): HubResourceType {
  if (value === "skill" || value === "prompt" || value === "hook" || value === "agent") return value;
  throw new Error(`Unsupported resource type "${value}". Supported types: skill, prompt, hook, agent`);
}

function requireTarget(value: string | undefined): asserts value is string {
  if (!value) throw new Error("Target is required. Supported targets: codex, kiro, claude-code, all");
}

function runForTargets(target: string, fn: (target: string) => void): void {
  const result = runForTargetSelection(target, (adapter) => {
    if (target === "all") console.log(`\n== ${adapter.displayName} ==`);
    fn(adapter.id);
  });
  if (result.failed) process.exitCode = 1;
}

function printHelp(): void {
  console.log(`agent-hub

Usage:
  agent-hub list
  agent-hub doctor <codex|kiro|claude-code|all> [--config-dir <path>]
  agent-hub status <codex|kiro|claude-code|all> [--config-dir <path>]
  agent-hub install <codex|kiro|claude-code|all> [--resource <id>] [--type <type>] [--all] [--dry-run] [--force] [--config-dir <path>]
  agent-hub update <codex|kiro|claude-code|all> [--resource <id>] [--type <type>] [--all] [--dry-run] [--force] [--config-dir <path>]
  agent-hub uninstall <codex|kiro|claude-code|all> [--resource <id>] [--dry-run] [--config-dir <path>]
`);
}
