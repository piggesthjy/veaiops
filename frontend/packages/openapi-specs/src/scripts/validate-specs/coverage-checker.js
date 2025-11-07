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
 * 接口覆盖率检查器
 * 检查 OpenAPI 规范中是否包含了预期的所有接口
 */
class CoverageChecker {
  constructor(specsDir) {
    this.specsDir = specsDir;
  }

  /**
   * 检查接口覆盖率
   */
  checkApiCoverage(config) {
    console.log('📊 检查接口覆盖率...');

    // 预期的接口列表（基于需求文档）
    const expectedApis = [
      // 系统配置管理
      'GET /apis/v1/manager/system-config/bots/',
      'POST /apis/v1/manager/system-config/bots/',
      'GET /apis/v1/manager/system-config/bots/{bot_id}',
      'PUT /apis/v1/manager/system-config/bots/{bot_id}',
      'DELETE /apis/v1/manager/system-config/bots/{bot_id}',

      'GET /apis/v1/manager/system-config/customers/',
      'POST /apis/v1/manager/system-config/customers/',
      'DELETE /apis/v1/manager/system-config/customers/{customer_id}',

      'GET /apis/v1/manager/system-config/products/',
      'POST /apis/v1/manager/system-config/products/',
      'DELETE /apis/v1/manager/system-config/products/{product_id}',

      'GET /apis/v1/manager/system-config/projects/',
      'POST /apis/v1/manager/system-config/projects/',
      'DELETE /apis/v1/manager/system-config/projects/{project_id}',

      'GET /apis/v1/manager/system-config/global-config/',

      // 用户认证与管理
      'POST /apis/v1/auth/login',
      'GET /apis/v1/manager/users/',
      'POST /apis/v1/manager/users/',
      'GET /apis/v1/manager/users/{user_id}',
      'PUT /apis/v1/manager/users/{user_id}',
      'DELETE /apis/v1/manager/users/{user_id}',
      'PUT /apis/v1/manager/users/{user_id}/password',

      // 监控数据源管理
      'GET /apis/v1/datasources/',
      'POST /apis/v1/datasources/',
      'GET /apis/v1/datasources/{datasource_id}',
      'PUT /apis/v1/datasources/{datasource_id}',
      'DELETE /apis/v1/datasources/{datasource_id}',

      // 值班管理
      'GET /apis/v1/oncall/oncall_rule/{rule_id}',
      'POST /apis/v1/oncall/oncall_rule/{rule_id}/oncall_schedule/',
    ];

    // 收集所有已定义的接口
    const definedApis = new Set();

    for (const module of config.modules) {
      this.collectApisFromModule(module, definedApis);
    }

    // 检查缺失的接口
    const missingApis = expectedApis.filter((api) => !definedApis.has(api));
    const extraApis = Array.from(definedApis).filter(
      (api) => !expectedApis.includes(api),
    );

    console.log(`   📈 已定义接口: ${definedApis.size}`);
    console.log(`   📋 预期接口: ${expectedApis.length}`);
    console.log(
      `   📊 覆盖率: ${((definedApis.size / expectedApis.length) * 100).toFixed(1)}%`,
    );

    if (missingApis.length > 0) {
      console.log('\n   ❌ 缺失的接口:');
      missingApis.forEach((api) => console.log(`      - ${api}`));
    }

    if (extraApis.length > 0) {
      console.log('\n   ➕ 额外的接口:');
      extraApis.forEach((api) => console.log(`      - ${api}`));
    }
  }

  /**
   * 从模块中收集 API
   */
  collectApisFromModule(module, definedApis) {
    const modulePath = require('path').join(this.specsDir, module.file);
    const fs = require('fs');

    if (!fs.existsSync(modulePath)) {
      return;
    }

    try {
      const moduleSpec = JSON.parse(fs.readFileSync(modulePath, 'utf8'));

      if (moduleSpec.paths) {
        this.collectApisFromPaths(moduleSpec.paths, definedApis);
      }
    } catch {
      // 已在 validateModules 中处理
    }
  }

  /**
   * 从路径中收集 API
   */
  collectApisFromPaths(paths, definedApis) {
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of Object.keys(pathItem)) {
        if (this.isHttpMethod(method)) {
          definedApis.add(`${method.toUpperCase()} ${path}`);
        }
      }
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

module.exports = { CoverageChecker };
