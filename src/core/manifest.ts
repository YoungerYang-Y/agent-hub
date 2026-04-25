import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SUPPORTED_TARGETS } from "../adapters/types.js";

export type HubResourceType = "skill" | "prompt" | "hook" | "agent";
export type HubTarget = (typeof SUPPORTED_TARGETS)[number];

export interface HubResource {
  id: string;
  type: HubResourceType;
  source: string;
  targets: HubTarget[];
  default: boolean;
  description: string;
}

export interface ManifestIssue {
  file: string;
  level: "error" | "warning";
  message: string;
}

export interface ResourceSelectionOptions {
  allResources: boolean;
  resourceId?: string;
  resourceType?: HubResourceType;
}

const REGISTRY_FILES: Array<{ file: string; type: HubResourceType }> = [
  { file: "skills.json", type: "skill" },
  { file: "prompts.json", type: "prompt" },
  { file: "hooks.json", type: "hook" },
  { file: "agents.json", type: "agent" },
];

const RESOURCE_TYPES = new Set<HubResourceType>(["skill", "prompt", "hook", "agent"]);

export function loadRegistries(root: string): HubResource[] {
  const resources: HubResource[] = [];
  const issues: ManifestIssue[] = [];

  for (const registry of REGISTRY_FILES) {
    const relativePath = `registry/${registry.file}`;
    const absolutePath = join(root, relativePath);
    if (!existsSync(absolutePath)) continue;

    const parsed = JSON.parse(readFileSync(absolutePath, "utf-8")) as unknown;
    if (!Array.isArray(parsed)) {
      issues.push({ file: relativePath, level: "error", message: "registry file must contain an array" });
      continue;
    }

    for (const value of parsed) {
      const resourceIssues = validateResource(value, relativePath, root);
      issues.push(...resourceIssues);
      if (resourceIssues.some((issue) => issue.level === "error")) continue;
      resources.push(value as HubResource);
    }
  }

  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length > 0) {
    throw new Error(formatManifestIssues(errors));
  }

  return resources;
}

export function collectRegistryIssues(root: string): ManifestIssue[] {
  const issues: ManifestIssue[] = [];

  for (const registry of REGISTRY_FILES) {
    const relativePath = `registry/${registry.file}`;
    const absolutePath = join(root, relativePath);
    if (!existsSync(absolutePath)) {
      issues.push({ file: relativePath, level: "warning", message: "registry file does not exist" });
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(absolutePath, "utf-8")) as unknown;
      if (!Array.isArray(parsed)) {
        issues.push({ file: relativePath, level: "error", message: "registry file must contain an array" });
        continue;
      }
      for (const value of parsed) issues.push(...validateResource(value, relativePath, root));
    }
    catch (error) {
      issues.push({ file: relativePath, level: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  return issues;
}

export function validateResource(value: unknown, file: string, root: string): ManifestIssue[] {
  const issues: ManifestIssue[] = [];
  if (!isRecord(value)) {
    return [{ file, level: "error", message: "resource must be an object" }];
  }

  const id = value.id;
  const type = value.type;
  const source = value.source;
  const targets = value.targets;
  const defaultInstall = value.default;
  const description = value.description;

  if (typeof id !== "string" || id.trim() === "") {
    issues.push({ file, level: "error", message: "resource id is required" });
  }
  if (typeof type !== "string" || !RESOURCE_TYPES.has(type as HubResourceType)) {
    issues.push({ file, level: "error", message: `resource ${stringifyId(id)} has invalid type` });
  }
  if (typeof source !== "string" || source.trim() === "") {
    issues.push({ file, level: "error", message: `resource ${stringifyId(id)} source is required` });
  }
  else if (!existsSync(join(root, source))) {
    issues.push({ file, level: "error", message: `resource ${stringifyId(id)} source path does not exist: ${source}` });
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    issues.push({ file, level: "error", message: `resource ${stringifyId(id)} targets must be a non-empty array` });
  }
  else {
    for (const target of targets) {
      if (!SUPPORTED_TARGETS.includes(target as HubTarget)) {
        issues.push({ file, level: "error", message: `resource ${stringifyId(id)} has unsupported target: ${String(target)}` });
      }
    }
  }
  if (typeof defaultInstall !== "boolean") {
    issues.push({ file, level: "error", message: `resource ${stringifyId(id)} default must be boolean` });
  }
  if (typeof description !== "string") {
    issues.push({ file, level: "warning", message: `resource ${stringifyId(id)} description should be a string` });
  }

  return issues;
}

export function defaultResourcesForTarget(resources: HubResource[], target: HubTarget): HubResource[] {
  return resources.filter((resource) => resource.default && resource.targets.includes(target));
}

export function selectResourcesForTarget(resources: HubResource[], target: HubTarget, options: ResourceSelectionOptions): HubResource[] {
  return resources.filter((resource) => {
    if (!resource.targets.includes(target)) return false;
    if (options.resourceId && resource.id !== options.resourceId) return false;
    if (options.resourceType && resource.type !== options.resourceType) return false;
    if (!options.allResources && !options.resourceId && !resource.default) return false;
    return true;
  });
}

export function formatManifestIssues(issues: ManifestIssue[]): string {
  return issues.map((issue) => `${issue.level.toUpperCase()} ${issue.file}: ${issue.message}`).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyId(value: unknown): string {
  return typeof value === "string" && value ? value : "<unknown>";
}
