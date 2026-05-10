#!/usr/bin/env node
import { readFile, writeFile, mkdir, cp, stat, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { selectOne, selectMany, BACK } from "./lib/prompt.mjs";

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

// ── Adapters ──
const adapters = {
  kiro: { name: "kiro", env: "KIRO_HOME", default: join(homedir(), ".kiro") },
  codex: { name: "codex", env: "CODEX_HOME", default: join(homedir(), ".codex") },
  "claude-code": { name: "claude-code", env: "CLAUDE_HOME", default: join(homedir(), ".claude") },
};

function configDir(adapter, override) {
  return override ?? process.env[adapter.env] ?? adapter.default;
}

function subdir(type) {
  return { skill: "skills", prompt: "prompts", agent: "agents", hook: "hooks" }[type] || type;
}

// ── Registry ──
async function loadRegistries() {
  const files = ["skills.json", "agents.json", "prompts.json", "hooks.json"];
  const all = [];
  for (const f of files) {
    const raw = await readFile(join(REPO_ROOT, "registry", f), "utf-8");
    all.push(...JSON.parse(raw));
  }
  return all;
}

// ── Manifest ──
function manifestPath(dir) {
  return join(dir, ".agent-hub-manifest.json");
}

async function loadManifest(dir) {
  try {
    return JSON.parse(await readFile(manifestPath(dir), "utf-8"));
  } catch {
    return { version: 1, entries: [] };
  }
}

async function saveManifest(dir, manifest) {
  await mkdir(dir, { recursive: true });
  await writeFile(manifestPath(dir), JSON.stringify(manifest, null, 2) + "\n");
}

// ── Commands ──
const TYPE_ICONS = { skill: "📚", agent: "🤖", hook: "🪝", prompt: "💬" };

async function cmdList(target) {
  const entries = await loadRegistries();
  const filtered = target ? entries.filter(e => e.targets.includes(target)) : entries;
  if (!filtered.length) {
    console.log("No resources found.");
    return;
  }

  const grouped = new Map();
  for (const e of filtered) {
    const arr = grouped.get(e.type) ?? [];
    arr.push(e);
    grouped.set(e.type, arr);
  }
  for (const [type, items] of grouped) {
    const icon = TYPE_ICONS[type] || "📦";
    console.log(`\n${icon} ${type}s (${items.length}):`);
    for (const item of items) {
      const def = item.default ? "★" : " ";
      console.log(`  ${def} ${item.id.padEnd(35)} [${item.targets.join(", ")}]  ${item.description}`);
    }
  }
  console.log(`\n${"─".repeat(40)}\n📋 Total: ${filtered.length} resources`);
}

async function cmdInstall(opts) {
  const targets = opts.target === "all" ? Object.values(adapters) : [adapters[opts.target]];
  if (!targets[0]) {
    console.error(`Unknown target: ${opts.target}`);
    process.exitCode = 1;
    return;
  }

  const entries = await loadRegistries();

  for (const adapter of targets) {
    const dir = configDir(adapter, opts.configDir);
    let resources;
    if (opts._selected) {
      resources = opts._selected;
    } else {
      resources = entries.filter(e => e.targets.includes(adapter.name));
      if (opts.resource) resources = resources.filter(e => e.id === opts.resource);
      else if (!opts.all) resources = resources.filter(e => e.default);
    }

    if (!resources.length) {
      console.log(`[${adapter.name}] No resources to install.`);
      continue;
    }

    console.log(`\n[${adapter.name}] → ${dir}`);
    if (opts.dryRun) console.log("  (dry-run)\n");

    const manifest = await loadManifest(dir);
    if (!manifest.entries) manifest.entries = [];

    for (const entry of resources) {
      const src = join(REPO_ROOT, entry.source);
      const dest = join(dir, subdir(entry.type), entry.id);
      const label = `  ${entry.type}/${entry.id}`;

      if (opts.dryRun) {
        console.log(`${label} → ${dest}`);
        continue;
      }

      await mkdir(dirname(dest), { recursive: true });
      await cp(src, dest, { recursive: true, force: true });

      const idx = manifest.entries.findIndex(e => e.id === entry.id && e.type === entry.type);
      const rec = {
        id: entry.id,
        type: entry.type,
        source: entry.source,
        dest,
        installedAt: new Date().toISOString(),
      };
      if (idx >= 0) manifest.entries[idx] = rec;
      else manifest.entries.push(rec);
      console.log(`${label} ✓`);
    }

    if (!opts.dryRun) {
      await saveManifest(dir, manifest);
      console.log("  manifest saved.");
    }
  }
}

async function cmdStatus(target, configDirOverride) {
  const targets = target === "all" ? Object.values(adapters) : [adapters[target]];
  if (!targets[0]) {
    console.error(`Unknown target: ${target}`);
    process.exitCode = 1;
    return;
  }

  for (const adapter of targets) {
    const dir = configDir(adapter, configDirOverride);
    console.log(`\n[${adapter.name}] ${dir}`);
    try {
      await stat(dir);
    } catch {
      console.log("  ⚠ config dir does not exist");
      continue;
    }

    const manifest = await loadManifest(dir);
    if (!manifest.entries || !manifest.entries.length) {
      console.log("  No managed resources.");
      continue;
    }

    console.log(`  ${manifest.entries.length} managed resources:`);
    for (const entry of manifest.entries) {
      let exists = true;
      try {
        await stat(entry.dest);
      } catch {
        exists = false;
      }
      console.log(`    ${exists ? "✓" : "✗"} ${entry.type}/${entry.id}`);
    }
  }
}

async function cmdReset(target, configDirOverride) {
  const adapter = adapters[target];
  if (!adapter) {
    console.error(`Unknown target: ${target}`);
    process.exitCode = 1;
    return;
  }
  const dir = configDir(adapter, configDirOverride);

  console.log(`\n⚠️  ${"═".repeat(50)}`);
  console.log(`⚠️  警告：此操作将完全清除 ${dir} 下的受管资源目录`);
  console.log(`⚠️  包括: skills/, agents/, prompts/, hooks/`);
  console.log(`⚠️  然后重新安装当前 registry 中的默认资源`);
  console.log(`⚠️  ${"═".repeat(50)}\n`);

  if (process.stdin.isTTY) {
    const readline = await import("node:readline");
    const iface = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(r => iface.question("确认执行？输入 yes 继续: ", r));
    iface.close();
    if (answer.trim() !== "yes") {
      console.log("已取消。");
      return;
    }
  } else {
    console.error("非交互终端，请加 --confirm 标志确认");
    process.exitCode = 1;
    return;
  }

  const dirs = ["skills", "agents", "prompts", "hooks"].map(d => join(dir, d));
  for (const d of dirs) {
    try {
      await rm(d, { recursive: true, force: true });
    } catch {}
  }
  try {
    await rm(manifestPath(dir), { force: true });
  } catch {}
  console.log(`\n🗑  已清除 ${dir} 下的旧配置`);

  console.log("📦 重新安装默认资源...\n");
  await cmdInstall({ target, dryRun: false, all: false, configDir: configDirOverride });
  console.log("\n✅ 重置完成");
}

function printWelcome() {
  const E = "\x1B[";
  const cyan = s => `${E}36m${s}${E}0m`;
  const bold = s => `${E}1m${s}${E}0m`;
  const dim = s => `${E}2m${s}${E}0m`;

  const width = 51;
  const border = "─".repeat(width);
  // 中文等全角字符占 2 列，需按显示宽度计算
  const dispWidth = s => [...s.replace(/\x1B\[[0-9;]*m/g, "")].reduce((n, c) => n + (c.codePointAt(0) > 0x2E7F ? 2 : 1), 0);
  const pad = (s, w) => s + " ".repeat(Math.max(0, w - dispWidth(s)));

  const lines = [
    "",
    cyan(`  ╭${border}╮`),
    cyan("  │") + " ".repeat(width) + cyan("│"),
    cyan("  │") + pad(`  ${bold("Agent Hub")} — AI 配置安装器`, width) + cyan("│"),
    cyan("  │") + " ".repeat(width) + cyan("│"),
    cyan("  │") + pad(`  ${dim("集中维护 skills / prompts / hooks / agents")}`, width) + cyan("│"),
    cyan("  │") + pad(`  ${dim("并同步到本机 Kiro / Codex / Claude Code")}`, width) + cyan("│"),
    cyan("  │") + " ".repeat(width) + cyan("│"),
    cyan(`  ╰${border}╯`),
    "",
  ];
  console.log(lines.join("\n"));
}

async function cmdInteractiveInstall() {
  printWelcome();

  const entries = await loadRegistries();
  const names = Object.keys(adapters);
  const PLATFORM_ICONS = { kiro: "⚡", codex: "🧠", "claude-code": "🟣" };

  let step = 0;
  let target, dir, chosenKw, selected;

  const step_label = (n, total, text) => {
    const E = "\x1B[";
    return `\n${E}2m  Step ${n}/${total}${E}0m  ${E}1m${text}${E}0m`;
  };

  while (true) {
    if (step === 0) {
      console.log(step_label(1, 3, "选择安装目标"));
      const platformLabels = names.map(n => `${PLATFORM_ICONS[n] || "•"} ${n}  \x1B[2m${adapters[n].default}\x1B[0m`);
      const result = await selectOne("", platformLabels);
      if (result === BACK) return;
      target = names[result];
      dir = configDir(adapters[target]);
      step = 1;
    } else if (step === 1) {
      const resources = entries.filter(e => e.targets.includes(target));
      const allKeywords = [...new Set(resources.flatMap(e => e.keywords || []))].sort();
      if (allKeywords.length === 0) {
        step = 2;
        continue;
      }

      console.log(step_label(2, 3, "筛选技术栈关键词"));
      console.log("  \x1B[2m不选则显示全部资源，Esc 返回上一步\x1B[0m");
      const result = await selectMany("", allKeywords, []);
      if (result === BACK) {
        step = 0;
        continue;
      }
      chosenKw = new Set(result.map(i => allKeywords[i]));
      step = 2;
    } else if (step === 2) {
      const resources = entries.filter(e => e.targets.includes(target));
      const types = [...new Set(resources.map(e => e.type))].sort();
      selected = [];
      let backed = false;

      for (const type of types) {
        const icon = TYPE_ICONS[type] || "📦";
        const items = resources.filter(e => e.type === type);
        const maxId = Math.max(...items.map(e => e.id.length));
        const labels = items.map(e => {
          const star = e.default ? "\x1B[33m★\x1B[0m" : " ";
          return `${e.id.padEnd(maxId)}  ${star}  \x1B[2m${e.description}\x1B[0m`;
        });
        const defaults =
          chosenKw && chosenKw.size > 0
            ? items.map((e, i) => ((e.keywords || []).some(k => chosenKw.has(k)) ? i : -1)).filter(i => i >= 0)
            : items.map((e, i) => (e.default ? i : -1)).filter(i => i >= 0);

        console.log(step_label(3, 3, `选择 ${icon} ${type}s`));
        console.log("  \x1B[2mspace 切换选中，a 全选/全取消，Esc 返回\x1B[0m");
        const result = await selectMany("", labels, defaults);
        if (result === BACK) {
          backed = true;
          break;
        }
        selected.push(...result.map(i => items[i]));
      }

      if (backed) {
        step = 1;
        continue;
      }
      break;
    }
  }

  if (!selected || !selected.length) {
    console.log("\n  \x1B[2m未选择任何资源，已退出。\x1B[0m\n");
    return;
  }

  const E = "\x1B[";
  const types = [...new Set(selected.map(e => e.type))].sort();
  console.log(`\n${E}2m  ${"─".repeat(48)}${E}0m`);
  console.log(`  ${E}1m📦 安装计划${E}0m  ${E}36m${selected.length} 个资源${E}0m  →  ${E}2m${dir}${E}0m\n`);
  for (const type of types) {
    const items = selected.filter(e => e.type === type);
    if (!items.length) continue;
    console.log(`  ${TYPE_ICONS[type] || "📦"} ${E}1m${type}s${E}0m ${E}2m(${items.length})${E}0m`);
    for (const e of items) console.log(`     ${E}2m·${E}0m ${e.id}`);
  }
  console.log(`\n${E}2m  ${"─".repeat(48)}${E}0m\n`);

  await cmdInstall({ target, dryRun: false, _selected: selected });
  console.log(`\n  ${E}32m✓${E}0m ${E}1m安装完成${E}0m\n`);
}

// ── CLI ──
const args = process.argv.slice(2);
const command = args[0];
const flag = n => args.includes(`--${n}`);
const opt = n => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const targetNames = Object.keys(adapters);

function usage() {
  console.log(`Usage: agent-hub <command> [options]

Commands:
  list [target]                         列出已注册的资源
  install [target] [--apply] [opts]     安装/更新资源（默认 dry-run 预览）
  reset <target>                        ⚠️  清除旧配置并重新安装默认资源
  status [target]                       查看已安装资源状态

Targets: ${targetNames.join(", ")}, all

Install options:
  --apply                实际写入文件（不加则仅预览）
  --resource <id>        安装指定资源
  --all                  包含非默认资源
  --config-dir <path>    覆盖目标配置目录`);
}

try {
  switch (command) {
    case "list":
      await cmdList(args[1]);
      break;
    case "install": {
      if (!args[1]) {
        await cmdInteractiveInstall();
      } else {
        await cmdInstall({
          target: args[1],
          dryRun: !flag("apply"),
          resource: opt("resource"),
          all: flag("all"),
          configDir: opt("config-dir"),
        });
      }
      break;
    }
    case "status":
      await cmdStatus(args[1] ?? "all", opt("config-dir"));
      break;
    case "reset": {
      if (!args[1]) {
        console.error("Usage: agent-hub reset <target>");
        process.exitCode = 1;
        break;
      }
      await cmdReset(args[1], opt("config-dir"));
      break;
    }
    default:
      usage();
      if (command && command !== "--help" && command !== "-h") process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
