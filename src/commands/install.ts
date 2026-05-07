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
  
  // Group by type
  const byType = new Map<string, Array<{id: string, isNew: boolean}>>();
  for (const operation of result.operations) {
    const resource = resources.find(r => r.id === operation.resourceId);
    const type = resource?.type || 'unknown';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push({id: operation.resourceId, isNew: operation.isNew});
  }
  
  // Display summary table
  console.log('┌─────────────┬───────┐');
  console.log('│ Type        │ Count │');
  console.log('├─────────────┼───────┤');
  for (const [type, items] of byType) {
    const icon = getTypeIcon(type, '');
    console.log(`│ ${icon} ${type.padEnd(8)} │ ${items.length.toString().padStart(5)} │`);
  }
  console.log('└─────────────┴───────┘\n');
  
  // Display resource IDs by type with status
  for (const [type, items] of byType) {
    console.log(`  ${type}:`);
    for (const item of items) {
      const status = item.isNew ? '+ new' : '↻ update';
      console.log(`    ${status.padEnd(8)} ${item.id}`);
    }
    console.log();
  }
  
  if (!options.dryRun) console.log(`Manifest: ${result.manifestPath}`);
}
