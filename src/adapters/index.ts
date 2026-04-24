import { createClaudeCodeAdapter } from "./claude-code.js";
import { createCodexAdapter } from "./codex.js";
import { createKiroAdapter } from "./kiro.js";
import type { AgentAdapter } from "./types.js";
import type { HubTarget } from "../core/manifest.js";

export function allAdapters(): AgentAdapter[] {
  return [createCodexAdapter(), createKiroAdapter(), createClaudeCodeAdapter()];
}

export function adapterForTarget(target: string): AgentAdapter | undefined {
  return allAdapters().find((adapter) => adapter.id === target);
}

export function requireAdapter(target: string): AgentAdapter {
  const adapter = adapterForTarget(target);
  if (!adapter) {
    const supported = allAdapters().map((item) => item.id).join(", ");
    throw new Error(`Unsupported target "${target}". Supported targets: ${supported}`);
  }
  return adapter;
}

export function isHubTarget(target: string): target is HubTarget {
  return allAdapters().some((adapter) => adapter.id === target);
}
