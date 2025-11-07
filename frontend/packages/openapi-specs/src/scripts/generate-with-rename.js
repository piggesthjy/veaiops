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

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Complete API generation and renaming automation script
 * Includes: generate OpenAPI spec → generate TypeScript code → execute rename
 */
class GenerateWithRename {
  constructor() {
    this.outputDir = path.resolve(
      __dirname,
      '../../../../apps/veaiops/api-generate',
    );
    this.openApiSpecPath = path.resolve(
      __dirname,
      '../../../../openapi-spec.json',
    );
    this.openapiCodegenPath = path.resolve(
      __dirname,
      '../../../../../../openapi-typescript-codegen/bin/index.js',
    );
  }

  /**
   * Main generation flow
   */
  async generate() {
    console.log('🚀 开始完整的API生成和重命名流程...');

    try {
      // 1. 清理旧的生成目录
      this.cleanupOldGeneration();

      // 2. 生成TypeScript代码
      await this.generateTypeScriptCode();

      // 3. 删除自动生成的注释头
      this.removeGeneratedComments();

      // 4. 执行rename操作
      this.executeRename();

      // 5. 修复allOf类型冲突
      this.fixAllOfTypeConflicts();

      // 6. 替换any类型为unknown
      this.replaceAnyWithUnknown();

      // 7. 验证结果
      this.validateResult();

      console.log('🎉 完整的API生成和重命名流程完成!');
      console.log(`📁 生成目录: ${this.outputDir}`);
      console.log(`📊 总文件数: ${this.countGeneratedFiles()}`);
    } catch (error) {
      console.error('❌ 生成过程中出现错误:', error.message);
      throw error;
    }
  }

  /**
   * Clean old generated directory
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
        console.log(`📋 发现 ${preservedFiles.length} 个需要保留的文件:`);
        preservedFiles.forEach((file) => {
          console.log(`   - ${path.relative(this.outputDir, file)}`);
        });

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
   * Generate TypeScript code using openapi-typescript-codegen
   */
  async generateTypeScriptCode() {
    console.log('⚙️  使用openapi-typescript-codegen生成TypeScript代码...');

    if (!fs.existsSync(this.openApiSpecPath)) {
      throw new Error(`OpenAPI规范文件不存在: ${this.openApiSpecPath}`);
    }

    // 检查是否存在自定义的 openapi-typescript-codegen
    let command;
    if (fs.existsSync(this.openapiCodegenPath)) {
      console.log('使用自定义的 openapi-typescript-codegen');
      command = [
        `node ${this.openapiCodegenPath}`,
        `--input ${this.openApiSpecPath}`,
        `--output ${this.outputDir}`,
        '--client fetch',
        '--name VolcAIOpsApi',
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
          input: this.openApiSpecPath,
          output: this.outputDir,
          clientName: 'VolcAIOpsApi',
          httpClient: 'fetch',
          useOptions: false,
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
        command = `npx openapi-typescript-codegen -i ${this.openApiSpecPath} -o ${this.outputDir} --name VolcAIOpsApi`;
      }
    }

    console.log(`执行命令: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('✅ TypeScript代码生成完成');
  }

  /**
   * Remove auto-generated comment headers
   */
  removeGeneratedComments() {
    console.log('🧹 删除自动生成的注释头...');

    if (!fs.existsSync(this.outputDir)) {
      console.warn('⚠️  生成目录不存在，跳过删除注释');
      return;
    }

    const processFile = (filePath) => {
      if (!filePath.endsWith('.ts')) {
        return;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // 删除 openapi-typescript-codegen 生成的注释头
      const commentsToRemove = [
        /^\/\* generated using openapi-typescript-codegen -- do not edit \*\/\n?/m,
        /^\/\* istanbul ignore file \*\/\n?/m,
        /^\/\* tslint:disable \*\/\n?/m,
        /^\/\* eslint-disable \*\/\n?/m,
      ];

      commentsToRemove.forEach((pattern) => {
        const newContent = content.replace(pattern, '');
        if (newContent !== content) {
          updated = true;
          content = newContent;
        }
      });

      // 删除文件开头的多余空行
      content = content.replace(/^\n+/, '');

      if (updated) {
        fs.writeFileSync(filePath, content);
      }
    };

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
        } else {
          processFile(filePath);
        }
      }
    };

    // 处理所有目录
    processDirectory(this.outputDir);
    console.log('✅ 自动生成的注释头已删除');
  }

  /**
   * Execute rename operation
   */
  executeRename() {
    console.log('🔄 执行文件重命名操作...');

    if (!fs.existsSync(this.outputDir)) {
      throw new Error(`生成目录不存在: ${this.outputDir}`);
    }

    console.log('Step 1: Renaming files...');
    this.renameFilesInDirectory(path.join(this.outputDir, 'models'));
    this.renameFilesInDirectory(path.join(this.outputDir, 'services'));
    this.renameFilesInDirectory(path.join(this.outputDir, 'core'));
    this.renameFilesInDirectory(this.outputDir);

    console.log('Step 2: Updating imports and exports...');
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
   * Validate generated result
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
   * Count generated files
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
   * Fix type conflicts caused by allOf
   * Mainly resolves conflicts between base response type and specific data type 'data' property
   */
  fixAllOfTypeConflicts() {
    console.log('🔧 修复allOf类型冲突...');

    if (!fs.existsSync(this.outputDir)) {
      console.warn('⚠️  API生成目录不存在，跳过类型冲突修复');
      return;
    }

    /**
     * Process type conflict in a single file
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
    console.log('🔄 将 any 类型替换为 unknown...');

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
}

// If this script is run directly
if (require.main === module) {
  const generator = new GenerateWithRename();
  generator.generate().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    throw error;
  });
}

module.exports = GenerateWithRename;
