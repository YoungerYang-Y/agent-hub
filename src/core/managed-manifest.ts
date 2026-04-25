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

function resolveHashState(sourcePath: string, destinationPath: string, destinationState: DestinationState, expectedHash: string): HashState {
  if (destinationState === "missing") {
    return existsSync(sourcePath) ? "destination-missing" : "source-missing";
  }
  if (!existsSync(sourcePath)) return "source-missing";
  return hashPath(destinationPath) === expectedHash ? "current" : "drifted";
}
