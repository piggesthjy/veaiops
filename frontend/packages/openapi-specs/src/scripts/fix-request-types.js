#!/usr/bin/env node

// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * 修复 request.ts 中的TypeScript类型错误
 *
 * 这个脚本专门用于修复 openapi-typescript-codegen 生成的 request.ts 文件中的类型错误
 */

const fs = require('fs');
const path = require('path');

const REQUEST_FILE = path.resolve(
  __dirname,
  '../../../api-client/src/core/request.ts',
);

console.log('🔧 修复 request.ts 类型错误...');

if (!fs.existsSync(REQUEST_FILE)) {
  console.error('❌ request.ts 文件不存在:', REQUEST_FILE);
  /**
   * 为什么使用 process.exit()：
   * - 这是 Node.js 脚本，在关键错误时需要使用 process.exit() 正确退出
   * - 脚本的执行失败应该以非零退出码终止，便于 CI/CD 和其他自动化工具检测
   * - 在 Node.js 脚本中使用 process.exit() 是标准做法
   */
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

let content = fs.readFileSync(REQUEST_FILE, 'utf8');
const originalContent = content;
let fixCount = 0;

// 1. 修复 isBlob 函数
const oldIsBlob = `export const isBlob = (value: unknown): value is Blob => {
  return (
    typeof value === 'object' &&
    typeof value.type === 'string' &&
    typeof value.stream === 'function' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.constructor === 'function' &&
    typeof value.constructor.name === 'string' &&
    /^(Blob|File)$/.test(value.constructor.name) &&
    /^(Blob|File)$/.test(value[Symbol.toStringTag])
  );
};`;

const newIsBlob = `export const isBlob = (value: unknown): value is Blob => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string | symbol, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.stream === 'function' &&
    typeof obj.arrayBuffer === 'function' &&
    typeof obj.constructor === 'function' &&
    typeof (obj.constructor as { name?: string }).name === 'string' &&
    /^(Blob|File)$/.test((obj.constructor as { name: string }).name) &&
    typeof obj[Symbol.toStringTag] === 'string' &&
    /^(Blob|File)$/.test(obj[Symbol.toStringTag] as string)
  );
};`;

if (content.includes(oldIsBlob)) {
  content = content.replace(oldIsBlob, newIsBlob);
  fixCount++;
  console.log('  ✅ 修复 isBlob 函数');
}

// 2. 修复 getQueryString 中的 object 类型判断
if (content.includes("} else if (typeof value === 'object') {")) {
  const oldGetQueryString =
    /} else if \(typeof value === 'object'\) \{\s*Object\.entries\(value\)\.forEach/g;
  const newGetQueryString = `} else if (typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, unknown>).forEach`;

  const matches = content.match(oldGetQueryString);
  if (matches) {
    content = content.replace(oldGetQueryString, newGetQueryString);
    fixCount++;
    console.log('  ✅ 修复 getQueryString 类型判断');
  }
}

// 3. 修复 body 的类型问题
if (content.includes('body: body ?? formData,')) {
  content = content.replace(
    /body: body \?\? formData,/g,
    'body: (body ?? formData) as BodyInit | null | undefined,',
  );
  fixCount++;
  console.log('  ✅ 修复 body 类型');
}

// 4. 修复 resolve 的类型问题
if (content.includes('resolve(result.body);')) {
  content = content.replace(
    /resolve\(result\.body\);/g,
    'resolve(result.body as T);',
  );
  fixCount++;
  console.log('  ✅ 修复 resolve 类型');
}

// 保存修改
if (content !== originalContent) {
  fs.writeFileSync(REQUEST_FILE, content);
  console.log(`\n✅ 总共修复 ${fixCount} 处类型错误`);
} else {
  console.log('\nℹ️  没有发现需要修复的问题');
}
