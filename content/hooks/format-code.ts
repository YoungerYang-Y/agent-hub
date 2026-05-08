#!/usr/bin/env node
// 响应结束后格式化代码
import { existsSync } from 'fs';
import { execSync } from 'child_process';

try {
  if (existsSync('package.json')) {
    execSync('npm run format', { stdio: 'ignore' });
  } else if (existsSync('Cargo.toml')) {
    execSync('cargo fmt', { stdio: 'ignore' });
  }
} catch {
  // 忽略格式化错误
}

process.exit(0);