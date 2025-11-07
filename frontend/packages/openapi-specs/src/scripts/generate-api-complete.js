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
 * 为什么禁用 max-lines 规则：
 * - 这是一个代码生成脚本，包含复杂的 OpenAPI 规范合并、代码生成、后处理等逻辑
 * - 脚本的逻辑完整性和可维护性比行数限制更重要
 * - 拆分脚本会导致逻辑分散，增加理解和维护成本
 * - 生成脚本通常不会被频繁修改，行数问题影响较小
 */
/* eslint-disable max-lines */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * VolcAIOpsKit API 完整生成脚本
 *
 * 功能：
 * 1. 合并模块化的 OpenAPI 规范
 * 2. 生成 TypeScript API 客户端
 * 3. 文件重命名为 kebab-case
 * 4. 修复 allOf 类型冲突
 * 5. 替换 any 类型为 unknown
 * 6. 清理生成的注释
 * 7. 移除重复代码
 */

class APIGenerator {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..');
    this.specsDir = path.join(this.rootDir, 'src/specs');
    // ✅ 修改输出目录：从 apps/veaiops/api-generate 迁移到 packages/api-client/src
    this.outputDir = path.join(this.rootDir, '../api-client/src');
    this.tempDir = path.join(this.rootDir, 'temp');
    this.openapiCodegenPath = path.resolve(
      __dirname,
      '../../../node_modules/openapi-typescript-codegen/bin/index.js',
    );

    this.config = this.loadConfig();
    this.mergedSpec = null;
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    const configPath = path.join(this.specsDir, 'api-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * 合并所有模块的 OpenAPI 规范
   */
  mergeSpecs() {
    console.log('🔄 Step 1: 合并 OpenAPI 规范...');

    const baseSpec = {
      openapi: this.config.openapi,
      info: this.config.info,
      servers: this.config.servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    };

    // 合并基础配置中的 schemas
    if (this.config.components?.schemas) {
      Object.assign(
        baseSpec.components.schemas,
        this.config.components.schemas,
      );
    }

    // 合并每个模块
    for (const module of this.config.modules) {
      const modulePath = path.join(this.specsDir, module.file);

      if (!fs.existsSync(modulePath)) {
        console.warn(`⚠️  模块文件不存在: ${modulePath}`);
        continue;
      }

      console.log(`   - 合并模块: ${module.name}`);
      const moduleSpec = JSON.parse(fs.readFileSync(modulePath, 'utf8'));

      // 合并 paths
      if (moduleSpec.paths) {
        Object.assign(baseSpec.paths, moduleSpec.paths);
      }

      // 合并 schemas
      if (moduleSpec.components?.schemas) {
        Object.assign(
          baseSpec.components.schemas,
          moduleSpec.components.schemas,
        );
      }

      // 合并其他 components
      if (moduleSpec.components) {
        [
          'parameters',
          'responses',
          'examples',
          'requestBodies',
          'headers',
          'links',
          'callbacks',
        ].forEach((key) => {
          if (moduleSpec.components[key]) {
            if (!baseSpec.components[key]) {
              baseSpec.components[key] = {};
            }
            Object.assign(baseSpec.components[key], moduleSpec.components[key]);
          }
        });
      }
    }

    this.mergedSpec = baseSpec;

    // 保存合并后的规范到临时文件
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const mergedPath = path.join(this.tempDir, 'merged-spec.json');
    fs.writeFileSync(mergedPath, JSON.stringify(baseSpec, null, 2));

    console.log(`✅ 合并完成，共 ${Object.keys(baseSpec.paths).length} 个接口`);
    return mergedPath;
  }

  /**
   * 验证合并后的规范
   */
  validateSpec() {
    if (!this.config.validation.strict_mode) {
      return true;
    }

    console.log('🔍 Step 2: 验证 OpenAPI 规范...');

    const paths = Object.keys(this.mergedSpec.paths);
    const schemas = Object.keys(this.mergedSpec.components.schemas);

    console.log(`   - 接口数量: ${paths.length}`);
    console.log(`   - Schema 数量: ${schemas.length}`);

    // 检查重复路径
    if (this.config.validation.check_duplicates) {
      const duplicates = this.findDuplicatePaths(paths);
      if (duplicates.length > 0) {
        console.warn('⚠️  发现重复路径:', duplicates);
      }
    }

    console.log('✅ 规范验证通过');
    return true;
  }

  /**
   * 查找重复路径
   */
  findDuplicatePaths(paths) {
    const seen = new Set();
    const duplicates = [];

    for (const path of paths) {
      if (seen.has(path)) {
        duplicates.push(path);
      } else {
        seen.add(path);
      }
    }

    return duplicates;
  }

  /**
   * 清理旧的生成目录（保留重要文件）
   */
  cleanupOldGeneration() {
    console.log('🧹 清理旧的生成目录...');

    if (!fs.existsSync(this.outputDir)) {
      console.log('📁 生成目录不存在，跳过清理');
      return;
    }

    // 需要保留的手动维护文件模式
    const preservePatterns = [
      '*.json', // OpenAPI 规范文件
      '*.yml', // YAML 配置文件
      '*.yaml', // YAML 配置文件
      '*.md', // 文档文件
      '*.config.js', // 配置文件
      '*.config.ts', // TypeScript 配置文件
      '.gitkeep', // Git 保持文件
      'README*', // README 文件
      'CHANGELOG*', // 变更日志
    ];

    // 备份需要保留的文件
    const tempBackupDir = path.join(
      this.outputDir,
      '..',
      '.api-generate-backup',
    );
    const preservedFiles = [];

    try {
      // 查找需要保留的文件
      for (const pattern of preservePatterns) {
        const files = execSync(
          `find "${this.outputDir}" -name "${pattern}" -type f 2>/dev/null || true`,
          {
            encoding: 'utf8',
          },
        )
          .trim()
          .split('\n')
          .filter((f) => f);

        preservedFiles.push(...files);
      }

      if (preservedFiles.length > 0) {
        console.log(`📋 发现 ${preservedFiles.length} 个需要保留的文件`);

        // 创建临时备份目录
        if (!fs.existsSync(tempBackupDir)) {
          fs.mkdirSync(tempBackupDir, { recursive: true });
        }

        // 备份文件
        for (const file of preservedFiles) {
          const relativePath = path.relative(this.outputDir, file);
          const backupPath = path.join(tempBackupDir, relativePath);
          const backupDir = path.dirname(backupPath);

          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }

          fs.copyFileSync(file, backupPath);
        }
        console.log('💾 文件已备份到临时目录');
      }

      // 删除整个生成目录
      execSync(`rm -rf ${this.outputDir}`, { stdio: 'inherit' });
      console.log('🗑️  旧目录已清理');

      // 恢复保留的文件
      if (preservedFiles.length > 0) {
        // 重新创建生成目录
        fs.mkdirSync(this.outputDir, { recursive: true });

        // 恢复文件
        for (const file of preservedFiles) {
          const relativePath = path.relative(this.outputDir, file);
          const backupPath = path.join(tempBackupDir, relativePath);
          const restorePath = path.join(this.outputDir, relativePath);
          const restoreDir = path.dirname(restorePath);

          if (!fs.existsSync(restoreDir)) {
            fs.mkdirSync(restoreDir, { recursive: true });
          }

          fs.copyFileSync(backupPath, restorePath);
        }

        // 清理临时备份目录
        execSync(`rm -rf ${tempBackupDir}`, { stdio: 'inherit' });
        console.log('♻️  保留文件已恢复');
      }

      console.log('✅ 选择性清理完成');
    } catch (error) {
      console.error('❌ 清理过程中出现错误:', error.message);

      // 清理临时备份目录（如果存在）
      if (fs.existsSync(tempBackupDir)) {
        try {
          execSync(`rm -rf ${tempBackupDir}`, { stdio: 'inherit' });
        } catch (cleanupError) {
          console.warn('⚠️  清理临时备份目录失败:', cleanupError.message);
        }
      }

      throw error;
    }
  }

  /**
   * 生成 TypeScript API 客户端
   */
  async generateClient(specPath) {
    console.log('🚀 Step 3: 生成 TypeScript API 客户端...');

    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 检查是否存在自定义的 openapi-typescript-codegen
    let command;
    if (fs.existsSync(this.openapiCodegenPath)) {
      console.log('使用自定义的 openapi-typescript-codegen');
      command = [
        `node ${this.openapiCodegenPath}`,
        `--input ${specPath}`,
        `--output ${this.outputDir}`,
        '--client fetch',
        '--name VolcAIOpsApi',
        '--useOptions',
        '--exportCore true',
        '--exportServices true',
        '--exportModels true',
        '--exportSchemas false',
      ].join(' ');
    } else {
      console.log('使用标准的 openapi-typescript-codegen');
      // 回退到标准版本
      try {
        const { generate } = require('openapi-typescript-codegen');
        await generate({
          input: specPath,
          output: this.outputDir,
          clientName: 'VolcAIOpsApi',
          httpClient: 'fetch',
          useOptions: true,
          useUnionTypes: false,
          exportCore: true,
          exportServices: true,
          exportModels: true,
          exportSchemas: false,
          indent: '2',
          postfixServices: 'Service',
          write: true,
        });
        console.log('✅ TypeScript代码生成完成 (programmatic)');
        return;
      } catch (programmaticError) {
        console.warn(
          '⚠️  程序化生成失败，使用CLI方式:',
          programmaticError.message,
        );
        command = `npx openapi-typescript-codegen -i ${specPath} -o ${this.outputDir} --name VolcAIOpsApi`;
      }
    }

    console.log(`执行命令: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('✅ TypeScript代码生成完成');
  }

  /**
   * 执行文件重命名操作
   */
  executeRename() {
    console.log('🔄 Step 4: 执行文件重命名操作...');

    if (!fs.existsSync(this.outputDir)) {
      throw new Error(`生成目录不存在: ${this.outputDir}`);
    }

    console.log('Step 4.1: Renaming files...');
    this.renameFilesInDirectory(path.join(this.outputDir, 'models'));
    this.renameFilesInDirectory(path.join(this.outputDir, 'services'));
    this.renameFilesInDirectory(path.join(this.outputDir, 'core'));
    this.renameFilesInDirectory(this.outputDir);

    console.log('Step 4.2: Updating imports and exports...');
    this.updateImports(this.outputDir);

    console.log('✅ 文件重命名完成');
  }

  /**
   * Convert PascalCase or camelCase to kebab-case
   */
  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Convert file name from PascalCase to kebab-case
   */
  convertFileName(fileName) {
    const nameWithoutExt = path.parse(fileName).name;
    const { ext } = path.parse(fileName);
    return this.toKebabCase(nameWithoutExt) + ext;
  }

  /**
   * Recursively rename files in directory
   */
  renameFilesInDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.renameFilesInDirectory(filePath);
      } else if (file.endsWith('.ts') && file !== 'index.ts') {
        const newFileName = this.convertFileName(file);
        if (newFileName !== file) {
          const newFilePath = path.join(dirPath, newFileName);
          console.log(`Renaming: ${filePath} -> ${newFilePath}`);
          fs.renameSync(filePath, newFilePath);
        }
      }
    }
  }

  /**
   * Update import/export statements in files
   */
  updateImports(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.updateImports(filePath);
      } else if (file.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Update import statements
        const importPatterns = [
          /from '\.\.?\/models\/(\w+)';/g,
          /from '\.\.?\/services\/(\w+)';/g,
          /from '\.\.?\/core\/(\w+)';/g,
          /from '\.\.?\/\.\.?\/models\/(\w+)';/g,
          /from '\.\.?\/\.\.?\/services\/(\w+)';/g,
          /from '\.\.?\/\.\.?\/core\/(\w+)';/g,
          /from '\.\/(\w+)';/g,
        ];

        importPatterns.forEach((pattern) => {
          content = content.replace(pattern, (match, fileName) => {
            const newFileName = this.convertFileName(`${fileName}.ts`).replace(
              '.ts',
              '',
            );
            if (newFileName !== fileName) {
              updated = true;
              return match.replace(fileName, newFileName);
            }
            return match;
          });
        });

        // Update export statements
        const exportPatterns = [
          /from '\.\/models\/(\w+)';/g,
          /from '\.\/services\/(\w+)';/g,
          /from '\.\/core\/(\w+)';/g,
        ];

        exportPatterns.forEach((pattern) => {
          content = content.replace(pattern, (match, fileName) => {
            const newFileName = this.convertFileName(`${fileName}.ts`).replace(
              '.ts',
              '',
            );
            if (newFileName !== fileName) {
              updated = true;
              return match.replace(fileName, newFileName);
            }
            return match;
          });
        });

        if (updated) {
          console.log(`Updating imports in: ${filePath}`);
          fs.writeFileSync(filePath, content);
        }
      }
    }
  }

  /**
   * 修复allOf导致的类型冲突问题
   * 主要解决基础响应类型与具体数据类型的data属性冲突
   */
  fixAllOfTypeConflicts() {
    console.log('🔧 Step 5: 修复allOf类型冲突...');

    if (!fs.existsSync(this.outputDir)) {
      console.warn('⚠️  API生成目录不存在，跳过类型冲突修复');
      return;
    }

    /**
     * 处理单个文件的类型冲突
     */
    const processFile = (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // 检测并修复allOf类型冲突模式
      // 使用正则表达式匹配整个类型定义
      const allOfPattern =
        /export type (\w+) = \(\{[\s\S]*?data\?: unknown;[\s\S]*?\} & \{[\s\S]*?data\?: ([\s\S]*?)\}\);/g;

      content = content.replace(allOfPattern, (match, typeName, dataType) => {
        updated = true;
        console.log(`修复类型冲突: ${typeName}`);

        // 清理dataType，移除多余的空白和分号
        const cleanDataType = dataType.replace(/;\s*$/, '').trim();

        // 生成新的类型定义
        return `export type ${typeName} = {
    /**
     * 响应状态码
     */
    code?: number;
    /**
     * 响应消息
     */
    message?: string;
    /**
     * 响应数据
     */
    data?: ${cleanDataType};
};`;
      });

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(
          `已修复类型冲突: ${path.relative(this.outputDir, filePath)}`,
        );
      }
    };

    /**
     * 递归处理目录中的所有TypeScript文件
     */
    const processDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          processDirectory(filePath);
        } else if (
          file.endsWith('.ts') &&
          (file.includes('api-response') || file.includes('APIResponse'))
        ) {
          // 处理API响应类型文件（支持不同的命名格式）
          processFile(filePath);
        }
      }
    };

    // 处理models目录中的API响应类型
    const modelsDir = path.join(this.outputDir, 'models');
    if (fs.existsSync(modelsDir)) {
      processDirectory(modelsDir);
    }

    // 也处理根目录中的API响应类型文件（用于测试等场景）
    processDirectory(this.outputDir);

    console.log('✅ allOf类型冲突修复完成!');
  }

  /**
   * Replace 'any' types with 'unknown' for better type safety
   */
  replaceAnyWithUnknown() {
    console.log('🔄 Step 6: 将 any 类型替换为 unknown...');

    if (!fs.existsSync(this.outputDir)) {
      console.warn('⚠️  API生成目录不存在，跳过any类型替换');
      return;
    }

    /**
     * Process a single file to replace 'any' with 'unknown'
     */
    const processFile = (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // Replace 'any' types but preserve JSDoc comments and Promise error handlers
      const replacements = [
        // Function parameters: (value: any) =>
        {
          pattern: /\(([^)]*?):\s*any\)/g,
          replacement: (match, paramName) => {
            // Skip if it's a Promise error handler (reason?: any)
            if (
              paramName.includes('reason?') ||
              paramName.includes('onRejected')
            ) {
              return match;
            }
            return match.replace(': any', ': unknown');
          },
        },
        // Variable declarations: : any
        {
          pattern: /:\s*any(?=\s*[;,=)])/g,
          replacement: ': unknown',
        },
        // Generic types: <any>
        {
          pattern: /<any>/g,
          replacement: '<unknown>',
        },
        // Function return types: ): any =>
        {
          pattern: /\):\s*any(?=\s*=>)/g,
          replacement: '): unknown',
        },
        // Promise types: Promise<any>
        {
          pattern: /Promise<any>/g,
          replacement: 'Promise<unknown>',
        },
        // JSDoc @returns any
        {
          pattern: /@returns\s+any\b/g,
          replacement: '@returns unknown',
        },
      ];

      replacements.forEach(({ pattern, replacement }) => {
        if (typeof replacement === 'function') {
          content = content.replace(pattern, replacement);
        } else {
          const newContent = content.replace(pattern, replacement);
          if (newContent !== content) {
            updated = true;
            content = newContent;
          }
        }
      });

      // Additional check for updated flag when using function replacements
      const originalContent = fs.readFileSync(filePath, 'utf8');
      if (content !== originalContent) {
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(
          `Updated types in: ${path.relative(this.outputDir, filePath)}`,
        );
      }
    };

    /**
     * Recursively process all TypeScript files in directory
     */
    const processDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          processDirectory(filePath);
        } else if (file.endsWith('.ts')) {
          processFile(filePath);
        }
      }
    };

    // Process all directories
    processDirectory(this.outputDir);

    console.log('✅ any类型替换完成!');
  }

  /**
   * 移除重复代码
   */
  removeDuplicateCode() {
    console.log('🧹 Step 6: 移除重复代码...');

    // 这里可以添加具体的重复代码检测和移除逻辑
    // 目前先简单处理一些常见的重复模式

    const processFile = (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // 移除重复的导入语句
      const lines = content.split('\n');
      const uniqueLines = [];
      const seenImports = new Set();

      for (const line of lines) {
        if (line.trim().startsWith('import ')) {
          if (!seenImports.has(line.trim())) {
            seenImports.add(line.trim());
            uniqueLines.push(line);
          }
        } else {
          uniqueLines.push(line);
        }
      }

      content = uniqueLines.join('\n');

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      return false;
    };

    let changedFiles = 0;
    const processDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (item.endsWith('.ts')) {
          if (processFile(fullPath)) {
            changedFiles++;
          }
        }
      }
    };

    processDirectory(this.outputDir);
    console.log(`✅ 重复代码清理完成，修改了 ${changedFiles} 个文件`);
  }

  /**
   * 修复 request.ts 中的类型错误
   */
  fixRequestTypeIssues() {
    console.log('🔧 Step 7: 修复 request.ts 类型错误...');

    const requestFilePath = path.join(this.outputDir, 'core', 'request.ts');

    if (!fs.existsSync(requestFilePath)) {
      console.warn('⚠️  request.ts 文件不存在，跳过修复');
      return;
    }

    let content = fs.readFileSync(requestFilePath, 'utf8');
    const originalContent = content;

    // 修复 isBlob 函数 - 直接文本替换（注意精确匹配缩进）
    const oldIsBlobFunction = `export const isBlob = (value: unknown): value is Blob => {
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

    const newIsBlobFunction = `export const isBlob = (value: unknown): value is Blob => {
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

    if (content.includes(oldIsBlobFunction)) {
      content = content.replace(oldIsBlobFunction, newIsBlobFunction);
      console.log('  - 修复 isBlob 函数的类型错误');
    }

    // 修复 getQueryString 中的 object 类型判断
    if (content.includes("} else if (typeof value === 'object') {")) {
      content = content.replace(
        /} else if \(typeof value === 'object'\) \{\s*Object\.entries\(value\)\.forEach/g,
        `} else if (typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, unknown>).forEach`,
      );
      console.log('  - 修复 getQueryString 中的 object 类型判断');
    }

    // 修复 body 的类型问题
    if (content.includes('body: body ?? formData,')) {
      content = content.replace(
        /body: body \?\? formData,/g,
        `body: (body ?? formData) as BodyInit | null | undefined,`,
      );
      console.log('  - 修复 body 的类型问题');
    }

    // 修复 resolve 的类型问题
    if (content.includes('resolve(result.body);')) {
      content = content.replace(
        /resolve\(result\.body\);/g,
        `resolve(result.body as T);`,
      );
      console.log('  - 修复 resolve 的类型问题');
    }

    if (content !== originalContent) {
      fs.writeFileSync(requestFilePath, content);
      console.log('✅ request.ts 类型错误已修复');
    } else {
      console.log('ℹ️  request.ts 无需修复或修复失败');
    }
  }

  /**
   * 清理生成的注释
   */
  cleanGeneratedComments() {
    console.log('🧽 Step 8: 清理生成的注释...');

    const cleanFile = (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // 移除自动生成的注释
      content = content.replace(/\/\* tslint:disable \*\/\n/g, '');
      content = content.replace(/\/\* eslint-disable \*\/\n/g, '');
      content = content.replace(/\/\* istanbul ignore file \*\/\n/g, '');
      content = content.replace(
        /\/\* This file was auto-generated by openapi-typescript-codegen \*\/\n/g,
        '',
      );
      content = content.replace(
        /\/\* Do not make direct changes to the file \*\/\n/g,
        '',
      );

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      return false;
    };

    let changedFiles = 0;
    const processDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (item.endsWith('.ts')) {
          if (cleanFile(fullPath)) {
            changedFiles++;
          }
        }
      }
    };

    processDirectory(this.outputDir);
    console.log(`✅ 注释清理完成，修改了 ${changedFiles} 个文件`);
  }

  /**
   * 更新 index.ts，添加 FetchHttpRequest 等核心类型的导出
   */
  updateIndexExports() {
    console.log('🔧 Step 11: 更新 index.ts 导出...');

    const indexFilePath = path.join(this.outputDir, 'index.ts');
    const fetchHttpRequestPath = path.join(
      this.outputDir,
      'core',
      'fetch-http-request.ts',
    );
    const apiRequestOptionsPath = path.join(
      this.outputDir,
      'core',
      'api-request-options.ts',
    );

    if (!fs.existsSync(indexFilePath)) {
      console.warn('⚠️  index.ts 文件不存在，跳过导出更新');
      return;
    }

    let content = fs.readFileSync(indexFilePath, 'utf8');
    const originalContent = content;
    let updated = false;

    // 1. 添加 FetchHttpRequest 导出
    if (fs.existsSync(fetchHttpRequestPath)) {
      if (!content.includes('export { FetchHttpRequest }')) {
        const baseHttpRequestPattern =
          /export \{ BaseHttpRequest \} from '\.\/core\/base-http-request';/;
        if (baseHttpRequestPattern.test(content)) {
          content = content.replace(
            baseHttpRequestPattern,
            `export { BaseHttpRequest } from './core/base-http-request';
export { FetchHttpRequest } from './core/fetch-http-request';`,
          );
          console.log('✅ 已添加 FetchHttpRequest 导出');
          updated = true;
        } else {
          const apiErrorPattern =
            /export \{ ApiError \} from '\.\/core\/api-error';/;
          if (apiErrorPattern.test(content)) {
            content = content.replace(
              apiErrorPattern,
              `export { ApiError } from './core/api-error';
export { FetchHttpRequest } from './core/fetch-http-request';`,
            );
            console.log('✅ 已添加 FetchHttpRequest 导出（在 ApiError 后）');
            updated = true;
          }
        }
      } else {
        console.log('ℹ️  FetchHttpRequest 已导出');
      }
    } else {
      console.warn(
        '⚠️  fetch-http-request.ts 文件不存在，跳过 FetchHttpRequest 导出',
      );
    }

    // 2. 添加 ApiRequestOptions 类型导出
    if (fs.existsSync(apiRequestOptionsPath)) {
      if (!content.includes('export type { ApiRequestOptions }')) {
        const openApiConfigPattern =
          /export type \{ OpenAPIConfig \} from '\.\/core\/open-api';/;
        if (openApiConfigPattern.test(content)) {
          content = content.replace(
            openApiConfigPattern,
            `export type { OpenAPIConfig } from './core/open-api';
export type { ApiRequestOptions } from './core/api-request-options';`,
          );
          console.log('✅ 已添加 ApiRequestOptions 类型导出');
          updated = true;
        } else {
          // 如果没有找到 OpenAPIConfig，在 CancelablePromise 导出后添加
          const cancelablePromisePattern =
            /export \{ CancelablePromise, CancelError \} from '\.\/core\/cancelable-promise';/;
          if (cancelablePromisePattern.test(content)) {
            content = content.replace(
              cancelablePromisePattern,
              `export { CancelablePromise, CancelError } from './core/cancelable-promise';
export type { ApiRequestOptions } from './core/api-request-options';`,
            );
            console.log(
              '✅ 已添加 ApiRequestOptions 类型导出（在 CancelablePromise 后）',
            );
            updated = true;
          }
        }
      } else {
        console.log('ℹ️  ApiRequestOptions 已导出');
      }
    } else {
      console.warn(
        '⚠️  api-request-options.ts 文件不存在，跳过 ApiRequestOptions 导出',
      );
    }

    // 3. 添加 OnCancel 类型导出
    const cancelablePromisePath = path.join(
      this.outputDir,
      'core',
      'cancelable-promise.ts',
    );
    if (fs.existsSync(cancelablePromisePath)) {
      if (!content.includes('export type { OnCancel }')) {
        const cancelablePromisePattern =
          /export \{ CancelablePromise, CancelError \} from '\.\/core\/cancelable-promise';/;
        if (cancelablePromisePattern.test(content)) {
          content = content.replace(
            cancelablePromisePattern,
            `export { CancelablePromise, CancelError } from './core/cancelable-promise';
export type { OnCancel } from './core/cancelable-promise';`,
          );
          console.log('✅ 已添加 OnCancel 类型导出');
          updated = true;
        }
      } else {
        console.log('ℹ️  OnCancel 已导出');
      }
    } else {
      console.warn('⚠️  cancelable-promise.ts 文件不存在，跳过 OnCancel 导出');
    }

    if (updated) {
      fs.writeFileSync(indexFilePath, content);
      console.log('✅ index.ts 导出更新完成');
    } else {
      console.log('ℹ️  index.ts 无需更新');
    }
  }

  /**
   * 验证生成结果
   */
  validateResult() {
    console.log('🔍 验证生成结果...');

    const modelsDir = path.join(this.outputDir, 'models');
    const servicesDir = path.join(this.outputDir, 'services');
    const coreDir = path.join(this.outputDir, 'core');
    const indexFile = path.join(this.outputDir, 'index.ts');

    // 检查目录结构
    if (!fs.existsSync(modelsDir)) {
      throw new Error('models目录不存在');
    }
    if (!fs.existsSync(servicesDir)) {
      throw new Error('services目录不存在');
    }
    if (!fs.existsSync(coreDir)) {
      throw new Error('core目录不存在');
    }
    if (!fs.existsSync(indexFile)) {
      throw new Error('index.ts文件不存在');
    }

    // 统计文件数量
    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((f) => f.endsWith('.ts'));
    const serviceFiles = fs
      .readdirSync(servicesDir)
      .filter((f) => f.endsWith('.ts'));
    const coreFiles = fs.readdirSync(coreDir).filter((f) => f.endsWith('.ts'));

    console.log('📊 生成统计:');
    console.log(`   - 模型文件: ${modelFiles.length} 个`);
    console.log(`   - 服务文件: ${serviceFiles.length} 个`);
    console.log(`   - 核心文件: ${coreFiles.length} 个`);

    // 验证文件命名格式（应该是kebab-case）
    const allFiles = [...modelFiles, ...serviceFiles, ...coreFiles];
    const nonKebabFiles = allFiles.filter((f) => {
      const nameWithoutExt = f.replace('.ts', '');
      return (
        nameWithoutExt !== nameWithoutExt.toLowerCase() ||
        nameWithoutExt.includes('_') ||
        /[A-Z]/.test(nameWithoutExt)
      );
    });

    if (nonKebabFiles.length > 0) {
      console.warn(
        `⚠️  发现非kebab-case格式的文件: ${nonKebabFiles.join(', ')}`,
      );
    } else {
      console.log('✅ 所有文件都使用kebab-case命名格式');
    }
  }

  /**
   * 统计生成的文件数量
   */
  countGeneratedFiles() {
    const countFiles = (dir) => {
      if (!fs.existsSync(dir)) {
        return 0;
      }
      return fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).length;
    };

    const modelCount = countFiles(path.join(this.outputDir, 'models'));
    const serviceCount = countFiles(path.join(this.outputDir, 'services'));
    const coreCount = countFiles(path.join(this.outputDir, 'core'));
    const indexCount = fs.existsSync(path.join(this.outputDir, 'index.ts'))
      ? 1
      : 0;

    return modelCount + serviceCount + coreCount + indexCount;
  }

  /**
   * 清理临时文件
   */
  cleanup() {
    console.log('🧹 清理临时文件...');

    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }

    console.log('✅ 清理完成');
  }

  /**
   * 运行完整的生成流程
   */
  async run() {
    console.log('🚀 开始生成 VolcAIOpsKit API 客户端...\n');

    try {
      // Step 1: 清理旧的生成目录
      this.cleanupOldGeneration();

      // Step 2: 合并规范
      const mergedSpecPath = this.mergeSpecs();

      // Step 3: 验证规范
      this.validateSpec();

      // Step 4: 生成客户端代码
      await this.generateClient(mergedSpecPath);

      // Step 5: 执行文件重命名
      this.executeRename();

      // Step 6: 修复 allOf 类型冲突
      this.fixAllOfTypeConflicts();

      // Step 7: 修复 request.ts 类型错误
      this.fixRequestTypeIssues();

      // Step 8: 替换 any 类型为 unknown
      this.replaceAnyWithUnknown();

      // Step 9: 移除重复代码
      this.removeDuplicateCode();

      // Step 10: 清理生成的注释
      this.cleanGeneratedComments();

      // Step 11: 更新 index.ts 导出（添加 FetchHttpRequest 等）
      this.updateIndexExports();

      // Step 12: 验证生成结果
      this.validateResult();

      // Step 13: 运行独立的 request.ts 类型修复脚本
      console.log('🔧 Step 13: 运行 request.ts 类型修复脚本...');
      const fixScriptPath = path.join(__dirname, 'fix-request-types.js');
      if (fs.existsSync(fixScriptPath)) {
        execSync(`node ${fixScriptPath}`, { stdio: 'inherit' });
      } else {
        console.warn('⚠️  fix-request-types.js 不存在，跳过');
      }

      // 清理临时文件
      this.cleanup();

      console.log('\n🎉 完整的API生成和重命名流程完成!');
      console.log(`📁 输出目录: ${this.outputDir}`);
      console.log(`📊 总文件数: ${this.countGeneratedFiles()}`);
    } catch (error) {
      console.error('\n❌ 生成失败:', error.message);
      this.cleanup();
      throw new Error('API generation failed');
    }
  }
}

// 运行生成器
if (require.main === module) {
  const generator = new APIGenerator();
  generator.run();
}

module.exports = APIGenerator;
