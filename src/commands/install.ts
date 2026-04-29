import { requireAdapter } from "../adapters/index.js";
import { loadRegistries, selectResourcesForTarget, type HubResourceType } from "../core/manifest.js";
import { syncResources } from "../core/copy.js";

function getTypeIcon(type: string, resourceId: string): string {
  // 特殊处理：如果是 agent 相关的资源，即使类型是 prompt 也显示 agent 图标
  if (resourceId.includes('agent') || resourceId.includes('reviewer')) {
    return '🤖';
  }
  
  switch (type) {
    case 'skill': return '🔧';
    case 'agent': return '🤖';
    case 'prompt': return '💬';
    case 'hook': return '🪝';
    default: return '📄';
  }
}

export interface InstallCommandOptions {
  dryRun: boolean;
  force: boolean;
  configDir?: string;
  allResources: boolean;
  resourceId?: string;
  resourceType?: HubResourceType;
}

export function runInstall(repoRoot: string, target: string, options: InstallCommandOptions): void {
  const adapter = requireAdapter(target);
  const resources = selectResourcesForTarget(loadRegistries(repoRoot), adapter.id, {
    allResources: options.allResources,
    resourceId: options.resourceId,
    resourceType: options.resourceType,
  });
  const result = syncResources(resources, adapter, {
    repoRoot,
    configDir: options.configDir,
    dryRun: options.dryRun,
    force: options.force,
  });

  if (resources.length === 0) {
    console.log(`No resources matched for ${adapter.displayName}.`);
    return;
  }

  const action = options.dryRun ? "Plan" : "Installed";
  console.log(`\n${action}: ${result.operations.length} resource(s) → ${adapter.displayName}\n`);
  
  for (const operation of result.operations) {
    const resource = resources.find(r => r.id === operation.resourceId);
    const typeIcon = getTypeIcon(resource?.type || 'unknown', operation.resourceId);
    const source = operation.source.replace(repoRoot + "/", "");
    const dest = operation.destination.replace(process.env.HOME || "", "~");
    console.log(`  ${typeIcon} ${operation.resourceId}`);
    console.log(`    ${source} → ${dest}\n`);
  }
  
  if (!options.dryRun) console.log(`Manifest: ${result.manifestPath}`);
}
