import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { AgentAdapter, ConfigResolutionOptions } from "../adapters/types.js";
import type { HubResource } from "./manifest.js";
import { hashPath } from "./hash.js";

export interface SyncOptions extends ConfigResolutionOptions {
  repoRoot: string;
  dryRun: boolean;
  force: boolean;
}

export interface CopyOperation {
  resourceId: string;
  source: string;
  destination: string;
  status: "planned" | "copied";
}

export interface SyncResult {
  operations: CopyOperation[];
  manifestPath: string;
  dryRun: boolean;
}

interface ManagedManifest {
  version: 1;
  updatedAt: string;
  resources: ManagedResource[];
}

interface ManagedResource {
  id: string;
  type: string;
  target: string;
  source: string;
  destination: string;
  hash: string;
  updatedAt: string;
}

export function planInstall(resources: HubResource[], adapter: AgentAdapter, options: SyncOptions): SyncResult {
  return syncResources(resources, adapter, { ...options, dryRun: true });
}

export function syncResources(resources: HubResource[], adapter: AgentAdapter, options: SyncOptions): SyncResult {
  const configDir = adapter.resolveConfigDir(options);
  const manifestPath = join(configDir, ".agent-hub-manifest.json");
  const manifest = readManagedManifest(manifestPath);
  const operations: CopyOperation[] = [];
  const nextResources = [...manifest.resources];
  const now = new Date().toISOString();

  for (const resource of resources) {
    const sourcePath = join(options.repoRoot, resource.source);
    const destination = adapter.resolveInstallDestination(resource, options);
    const destinationRelativeToConfig = relative(configDir, destination.absolutePath);
    const existingManaged = manifest.resources.find(
      (item) => item.target === adapter.id && item.destination === destinationRelativeToConfig,
    );

    if (existsSync(destination.absolutePath) && !existingManaged && !options.force) {
      throw new Error(`Install conflict for ${resource.id}: ${destination.absolutePath} already exists and is not managed by agent-hub`);
    }

    operations.push({
      resourceId: resource.id,
      source: sourcePath,
      destination: destination.absolutePath,
      status: options.dryRun ? "planned" : "copied",
    });

    if (options.dryRun) continue;

    mkdirSync(dirname(destination.absolutePath), { recursive: true });
    if (existsSync(destination.absolutePath)) rmSync(destination.absolutePath, { recursive: true, force: true });
    cpSync(sourcePath, destination.absolutePath, { recursive: true });

    const managedResource: ManagedResource = {
      id: resource.id,
      type: resource.type,
      target: adapter.id,
      source: resource.source,
      destination: destinationRelativeToConfig,
      hash: hashPath(sourcePath),
      updatedAt: now,
    };
    const existingIndex = nextResources.findIndex(
      (item) => item.target === adapter.id && item.destination === destinationRelativeToConfig,
    );
    if (existingIndex >= 0) nextResources[existingIndex] = managedResource;
    else nextResources.push(managedResource);
  }

  if (!options.dryRun) {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      manifestPath,
      `${JSON.stringify({ version: 1, updatedAt: now, resources: nextResources } satisfies ManagedManifest, null, 2)}\n`,
    );
  }

  return { operations, manifestPath, dryRun: options.dryRun };
}

function readManagedManifest(path: string): ManagedManifest {
  if (!existsSync(path)) return { version: 1, updatedAt: "", resources: [] };
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as Partial<ManagedManifest>;
  return {
    version: 1,
    updatedAt: parsed.updatedAt ?? "",
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
  };
}
