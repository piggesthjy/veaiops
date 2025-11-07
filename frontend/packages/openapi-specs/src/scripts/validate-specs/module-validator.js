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
 * 模块验证器
 * 负责验证 OpenAPI 模块文件的完整性和正确性
 */
class ModuleValidator {
  constructor(errors, warnings) {
    this.errors = errors;
    this.warnings = warnings;
  }

  /**
   * 验证模块文件
   */
  validateModules(config, specsDir) {
    console.log('🔍 验证模块文件...');

    for (const module of config.modules) {
      const modulePath = require('path').join(specsDir, module.file);
      const fs = require('fs');

      if (!fs.existsSync(modulePath)) {
        this.errors.push(`模块文件不存在: ${module.file}`);
        continue;
      }

      try {
        const moduleSpec = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
        this.validateModuleSpec(module.name, moduleSpec);
        console.log(`   ✅ ${module.name}: 验证通过`);
      } catch (error) {
        this.errors.push(`模块 ${module.name} 解析失败: ${error.message}`);
      }
    }
  }

  /**
   * 验证单个模块规范
   */
  validateModuleSpec(moduleName, spec) {
    // 检查必需字段
    if (!spec.openapi) {
      this.errors.push(`模块 ${moduleName}: 缺少 openapi 字段`);
    }

    if (!spec.info) {
      this.errors.push(`模块 ${moduleName}: 缺少 info 字段`);
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      this.warnings.push(`模块 ${moduleName}: 没有定义任何路径`);
    }

    // 验证路径定义
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        this.validatePath(moduleName, path, pathItem);
      }
    }

    // 验证 Schema 定义
    if (spec.components?.schemas) {
      for (const [schemaName, schema] of Object.entries(
        spec.components.schemas,
      )) {
        this.validateSchema(moduleName, schemaName, schema);
      }
    }
  }

  /**
   * 验证路径定义
   */
  validatePath(moduleName, path, pathItem) {
    const allowedMethods = [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'head',
      'options',
      'trace',
    ];

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!allowedMethods.includes(method.toLowerCase())) {
        continue; // 跳过非 HTTP 方法的字段
      }

      // 检查必需字段
      if (!operation.summary) {
        this.warnings.push(
          `模块 ${moduleName}: ${method.toUpperCase()} ${path} 缺少 summary`,
        );
      }

      if (!operation.tags || operation.tags.length === 0) {
        this.warnings.push(
          `模块 ${moduleName}: ${method.toUpperCase()} ${path} 缺少 tags`,
        );
      }

      if (!operation.responses) {
        this.errors.push(
          `模块 ${moduleName}: ${method.toUpperCase()} ${path} 缺少 responses`,
        );
      }

      // 验证响应定义
      if (operation.responses) {
        this.validateResponses(
          moduleName,
          `${method.toUpperCase()} ${path}`,
          operation.responses,
        );
      }
    }
  }

  /**
   * 验证响应定义
   */
  validateResponses(moduleName, operationId, responses) {
    if (!responses['200'] && !responses['201']) {
      this.warnings.push(`模块 ${moduleName}: ${operationId} 没有成功响应定义`);
    }

    for (const [statusCode, response] of Object.entries(responses)) {
      if (!response.description) {
        this.warnings.push(
          `模块 ${moduleName}: ${operationId} 响应 ${statusCode} 缺少描述`,
        );
      }
    }
  }

  /**
   * 验证 Schema 定义
   */
  validateSchema(moduleName, schemaName, schema) {
    if (
      !schema.type &&
      !schema.$ref &&
      !schema.allOf &&
      !schema.oneOf &&
      !schema.anyOf
    ) {
      this.warnings.push(
        `模块 ${moduleName}: Schema ${schemaName} 缺少类型定义`,
      );
    }

    // 检查对象类型的必需字段
    if (schema.type === 'object') {
      this.validateRequiredFields(moduleName, schemaName, schema);
    }
  }

  /**
   * 验证必需字段
   */
  validateRequiredFields(moduleName, schemaName, schema) {
    if (!schema.required || schema.required.length === 0) {
      return;
    }

    if (!schema.properties) {
      this.errors.push(
        `模块 ${moduleName}: Schema ${schemaName} 有必需字段但没有属性定义`,
      );
      return;
    }

    for (const requiredField of schema.required) {
      this.validateRequiredField(moduleName, schemaName, requiredField, schema);
    }
  }

  /**
   * 验证单个必需字段
   */
  validateRequiredField(moduleName, schemaName, requiredField, schema) {
    if (!schema.properties[requiredField]) {
      this.errors.push(
        `模块 ${moduleName}: Schema ${schemaName} 必需字段 ${requiredField} 未在属性中定义`,
      );
    }
  }
}

module.exports = { ModuleValidator };
