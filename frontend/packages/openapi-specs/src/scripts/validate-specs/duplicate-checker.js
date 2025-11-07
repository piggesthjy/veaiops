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
 * 重复定义检查器
 * 检查 OpenAPI 规范中的路径和 Schema 是否存在重复定义
 */
class DuplicateChecker {
  constructor(errors, warnings) {
    this.errors = errors;
    this.warnings = warnings;
  }

  /**
   * 检查重复定义
   */
  checkDuplicates(config, specsDir) {
    console.log('🔍 检查重复定义...');

    const allPaths = new Map();
    const allSchemas = new Map();

    for (const module of config.modules) {
      const modulePath = require('path').join(specsDir, module.file);
      const fs = require('fs');

      if (!fs.existsSync(modulePath)) {
        continue;
      }

      try {
        const moduleSpec = JSON.parse(fs.readFileSync(modulePath, 'utf8'));

        // 检查路径重复
        if (moduleSpec.paths) {
          this.checkPathDuplicates(moduleSpec.paths, module.name, allPaths);
        }

        // 检查 Schema 重复
        if (moduleSpec.components?.schemas) {
          this.checkSchemaDuplicates(
            moduleSpec.components.schemas,
            module.name,
            allSchemas,
          );
        }
      } catch {
        // 已在 validateModules 中处理
      }
    }

    console.log(`   📊 总路径数: ${allPaths.size}`);
    console.log(`   📊 总 Schema 数: ${allSchemas.size}`);
  }

  /**
   * 检查路径重复
   */
  checkPathDuplicates(paths, moduleName, allPaths) {
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of Object.keys(pathItem)) {
        if (!this.isHttpMethod(method)) {
          continue;
        }
        this.checkPathDuplicate(path, method, moduleName, allPaths);
      }
    }
  }

  /**
   * 检查单个路径是否重复
   */
  checkPathDuplicate(path, method, moduleName, allPaths) {
    const key = `${method.toUpperCase()} ${path}`;
    if (allPaths.has(key)) {
      this.errors.push(
        `重复的路径定义: ${key} (在模块 ${allPaths.get(key)} 和 ${moduleName} 中)`,
      );
    } else {
      allPaths.set(key, moduleName);
    }
  }

  /**
   * 检查 Schema 重复
   */
  checkSchemaDuplicates(schemas, moduleName, allSchemas) {
    for (const schemaName of Object.keys(schemas)) {
      this.checkSchemaDuplicate(schemaName, moduleName, allSchemas);
    }
  }

  /**
   * 检查单个 Schema 是否重复
   */
  checkSchemaDuplicate(schemaName, moduleName, allSchemas) {
    if (allSchemas.has(schemaName)) {
      this.warnings.push(
        `重复的 Schema 定义: ${schemaName} (在模块 ${allSchemas.get(schemaName)} 和 ${moduleName} 中)`,
      );
    } else {
      allSchemas.set(schemaName, moduleName);
    }
  }

  /**
   * 判断是否为 HTTP 方法
   */
  isHttpMethod(method) {
    return ['get', 'post', 'put', 'delete', 'patch'].includes(
      method.toLowerCase(),
    );
  }
}

module.exports = { DuplicateChecker };
