#!/usr/bin/env node
// 写文件前验证
import { readFileSync } from 'fs';

try {
  const input = readFileSync(0, 'utf-8');
  const event = JSON.parse(input);
  
  const filePath = event.tool_input?.path;
  if (filePath?.endsWith('.md')) {
    console.error(`Writing markdown file: ${filePath}`);
    // 可以添加 markdown 格式检查
  }
} catch (error) {
  // 忽略解析错误
}

process.exit(0);