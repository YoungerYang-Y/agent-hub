import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import type { AgentAdapter, ConfigResolutionOptions } from "../adapters/types.js";
import type { HubResource } from "./manifest.js";
import { hashPath } from "./hash.js";
import { managedManifestPath, readManagedManifest, writeManagedManifest, type ManagedResource } from "./managed-manifest.js";

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
  isNew: boolean;
}

export interface SyncResult {
  operations: CopyOperation[];
  manifestPath: string;
  dryRun: boolean;
}

export function planInstall(resources: HubResource[], adapter: AgentAdapter, options: SyncOptions): SyncResult {
  return syncResources(resources, adapter, { ...options, dryRun: true });
}

export function syncResources(resources: HubResource[], adapter: AgentAdapter, options: SyncOptions): SyncResult {
  const configDir = adapter.resolveConfigDir(options);
  const manifestPath = managedManifestPath(configDir);
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
    const existingById = manifest.resources.find(
      (item) => item.target === adapter.id && item.id === resource.id,
    );

    // Clean up old destination if resource id exists but path changed
    if (!options.dryRun && existingById && existingById.destination !== destinationRelativeToConfig) {
      const oldPath = join(configDir, existingById.destination);
      if (existsSync(oldPath)) {
        rmSync(oldPath, { recursive: true, force: true });
      }

      // For Kiro agents, also clean up old prompt files
      if (adapter.id === "kiro" && resource.type === "agent") {
        const oldDir = dirname(oldPath);
        const oldBasename = basename(oldPath, ".json");
        const oldPromptFiles = ["md", "txt"].map(ext => join(oldDir, `${oldBasename}.${ext}`));
        for (const oldPrompt of oldPromptFiles) {
          if (existsSync(oldPrompt)) {
            rmSync(oldPrompt, { force: true });
          }
        }
      }
    }

    if (existsSync(destination.absolutePath) && !existingManaged && !options.force) {
      throw new Error([
        `Install conflict for ${resource.id}: ${destination.absolutePath} already exists and is not managed by agent-hub.`,
        `Manifest: ${manifestPath}`,
        "Next steps:",
        "- Use --force to replace the existing destination.",
        "- Use --config-dir <path> to test or install into another config directory.",
        "- Or manually back up/delete the destination, then retry.",
      ].join("\n"));
    }

    operations.push({
      resourceId: resource.id,
      source: sourcePath,
      destination: destination.absolutePath,
      status: options.dryRun ? "planned" : "copied",
      isNew: !existingManaged && !existingById,
    });

    if (options.dryRun) continue;

    mkdirSync(dirname(destination.absolutePath), { recursive: true });
    if (existsSync(destination.absolutePath)) rmSync(destination.absolutePath, { recursive: true, force: true });

    // Special handling for Kiro agents: flatten directory contents
    if (adapter.id === "kiro" && resource.type === "agent") {
      const agentJsonPath = join(sourcePath, "agent.json");
      if (!existsSync(agentJsonPath)) {
        throw new Error(`Agent source ${sourcePath} must contain agent.json`);
      }
      // Copy agent.json to destination (e.g., dev.json)
      cpSync(agentJsonPath, destination.absolutePath);

      // Copy prompt files to same directory if they exist
      const agentName = basename(sourcePath);
      const promptFiles = ["md", "txt"].map(ext =>
        join(sourcePath, `${agentName}.${ext}`)
      ).filter(existsSync);

      for (const promptFile of promptFiles) {
        const promptDest = join(dirname(destination.absolutePath), basename(promptFile));
        cpSync(promptFile, promptDest);
      }
    } else {
      cpSync(sourcePath, destination.absolutePath, { recursive: true });
    }

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
    const existingByIdIndex = nextResources.findIndex(
      (item) => item.target === adapter.id && item.id === resource.id,
    );

    // Remove old entry by id if path changed
    if (existingByIdIndex >= 0 && nextResources[existingByIdIndex].destination !== destinationRelativeToConfig) {
      nextResources.splice(existingByIdIndex, 1);
    }

    // Update or add new entry
    const finalIndex = nextResources.findIndex(
      (item) => item.target === adapter.id && item.destination === destinationRelativeToConfig,
    );
    if (finalIndex >= 0) nextResources[finalIndex] = managedResource;
    else nextResources.push(managedResource);
  }

  if (!options.dryRun) {
    mkdirSync(configDir, { recursive: true });
    writeManagedManifest(manifestPath, { version: 1, updatedAt: now, resources: nextResources });
  }

  return { operations, manifestPath, dryRun: options.dryRun };
}
