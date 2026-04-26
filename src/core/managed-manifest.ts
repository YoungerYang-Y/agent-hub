import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashPath } from "./hash.js";
import type { HubResource, HubResourceType, HubTarget } from "./manifest.js";

export interface ManagedManifest {
  version: 1;
  updatedAt: string;
  resources: ManagedResource[];
}

export interface ManagedResource {
  id: string;
  type: HubResourceType;
  target: HubTarget;
  source: string;
  destination: string;
  hash: string;
  updatedAt: string;
}

export type DestinationState = "present" | "missing";
export type HashState = "current" | "drifted" | "source-missing" | "destination-missing";
export type RegistryState = "current" | "stale";

export interface ManagedStatus {
  id: string;
  type: HubResourceType;
  source: string;
  destination: string;
  sourcePath: string;
  destinationPath: string;
  destinationState: DestinationState;
  hashState: HashState;
  registryState: RegistryState;
}

export interface CollectManagedStatusesOptions {
  manifest: ManagedManifest;
  registryResources: HubResource[];
  target: HubTarget;
  configDir: string;
  repoRoot: string;
}

export interface UninstallManagedResourcesOptions {
  manifest: ManagedManifest;
  manifestPath: string;
  target: HubTarget;
  configDir: string;
  resourceId?: string;
  dryRun: boolean;
  now?: string;
}

export interface UninstallOperation {
  id: string;
  destination: string;
  destinationPath: string;
  destinationState: DestinationState;
  status: "planned" | "removed";
}

export interface PruneManagedResourcesOptions {
  manifest: ManagedManifest;
  manifestPath: string;
  registryResources: HubResource[];
  target: HubTarget;
  configDir: string;
  repoRoot: string;
  dryRun: boolean;
  now?: string;
}

export function managedManifestPath(configDir: string): string {
  return join(configDir, ".agent-hub-manifest.json");
}

export function readManagedManifest(path: string): ManagedManifest {
  if (!existsSync(path)) return { version: 1, updatedAt: "", resources: [] };
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as Partial<ManagedManifest>;
  return {
    version: 1,
    updatedAt: parsed.updatedAt ?? "",
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
  };
}

export function writeManagedManifest(path: string, manifest: ManagedManifest): void {
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function collectManagedStatuses(options: CollectManagedStatusesOptions): ManagedStatus[] {
  const registryIds = new Set(options.registryResources.map((resource) => resource.id));
  return options.manifest.resources
    .filter((resource) => resource.target === options.target)
    .map((resource) => {
      const sourcePath = join(options.repoRoot, resource.source);
      const destinationPath = join(options.configDir, resource.destination);
      const destinationState: DestinationState = existsSync(destinationPath) ? "present" : "missing";
      const registryState: RegistryState = registryIds.has(resource.id) ? "current" : "stale";
      return {
        id: resource.id,
        type: resource.type,
        source: resource.source,
        destination: resource.destination,
        sourcePath,
        destinationPath,
        destinationState,
        registryState,
        hashState: resolveHashState(sourcePath, destinationPath, destinationState, resource.hash),
      };
    });
}

export function uninstallManagedResources(options: UninstallManagedResourcesOptions): { operations: UninstallOperation[]; manifest: ManagedManifest } {
  const operations: UninstallOperation[] = [];
  const remaining: ManagedResource[] = [];
  for (const resource of options.manifest.resources) {
    const matchesTarget = resource.target === options.target;
    const matchesResource = !options.resourceId || resource.id === options.resourceId;
    if (!matchesTarget || !matchesResource) {
      remaining.push(resource);
      continue;
    }

    const destinationPath = join(options.configDir, resource.destination);
    const destinationState: DestinationState = existsSync(destinationPath) ? "present" : "missing";
    operations.push({
      id: resource.id,
      destination: resource.destination,
      destinationPath,
      destinationState,
      status: options.dryRun ? "planned" : "removed",
    });

    if (!options.dryRun && destinationState === "present") {
      rmSync(destinationPath, { recursive: true, force: true });
    }
  }

  const nextManifest: ManagedManifest = {
    version: 1,
    updatedAt: options.dryRun ? options.manifest.updatedAt : options.now ?? new Date().toISOString(),
    resources: options.dryRun ? options.manifest.resources : remaining,
  };
  if (!options.dryRun && operations.length > 0) writeManagedManifest(options.manifestPath, nextManifest);
  return { operations, manifest: nextManifest };
}

export function pruneManagedResources(options: PruneManagedResourcesOptions): { operations: UninstallOperation[]; manifest: ManagedManifest } {
  const statuses = collectManagedStatuses({
    manifest: options.manifest,
    registryResources: options.registryResources,
    target: options.target,
    configDir: options.configDir,
    repoRoot: options.repoRoot,
  });
  const staleIds = new Set(statuses.filter((status) => status.registryState === "stale").map((status) => status.id));
  const operations: UninstallOperation[] = [];
  const remaining: ManagedResource[] = [];

  for (const resource of options.manifest.resources) {
    if (resource.target !== options.target || !staleIds.has(resource.id)) {
      remaining.push(resource);
      continue;
    }

    const destinationPath = join(options.configDir, resource.destination);
    const destinationState: DestinationState = existsSync(destinationPath) ? "present" : "missing";
    operations.push({
      id: resource.id,
      destination: resource.destination,
      destinationPath,
      destinationState,
      status: options.dryRun ? "planned" : "removed",
    });

    if (!options.dryRun && destinationState === "present") {
      rmSync(destinationPath, { recursive: true, force: true });
    }
  }

  const nextManifest: ManagedManifest = {
    version: 1,
    updatedAt: options.dryRun ? options.manifest.updatedAt : options.now ?? new Date().toISOString(),
    resources: options.dryRun ? options.manifest.resources : remaining,
  };
  if (!options.dryRun && operations.length > 0) writeManagedManifest(options.manifestPath, nextManifest);
  return { operations, manifest: nextManifest };
}

function resolveHashState(sourcePath: string, destinationPath: string, destinationState: DestinationState, expectedHash: string): HashState {
  if (destinationState === "missing") {
    return existsSync(sourcePath) ? "destination-missing" : "source-missing";
  }
  if (!existsSync(sourcePath)) return "source-missing";
  return hashPath(destinationPath) === expectedHash ? "current" : "drifted";
}
