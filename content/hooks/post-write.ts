#!/usr/bin/env node
// 写文件后处理
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

try {
  const input = readFileSync(0, 'utf-8');
  const event = JSON.parse(input);

  const filePath = event.tool_input?.path;
  if (filePath?.includes('docs/')) {
    console.error('Updated documentation, running lint...');
    // 运行文档检查
    if (existsSync('scripts/lint-docs.ts')) {
      try {
        execSync('node scripts/lint-docs.ts', { stdio: 'ignore' });
      } catch {
        // 忽略 lint 错误
      }
    }
  }
} catch (error) {
  // 忽略解析错误
}

process.exit(0);
