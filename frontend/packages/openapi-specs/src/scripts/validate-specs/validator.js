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
const { ModuleValidator } = require('./module-validator');
const { CoverageChecker } = require('./coverage-checker');
const { DuplicateChecker } = require('./duplicate-checker');

/**
 * OpenAPI 规范验证器
 *
 * 功能：
 * 1. 验证模块文件的完整性
 * 2. 检查接口覆盖率
 * 3. 验证 Schema 定义
 * 4. 检查重复定义
 */
class SpecValidator {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../..');
    this.specsDir = path.join(this.rootDir, 'src/specs');
    this.configPath = path.join(this.specsDir, 'api-config.json');

    this.config = this.loadConfig();
    this.errors = [];
    this.warnings = [];

    // 初始化各个检查器
    this.moduleValidator = new ModuleValidator(this.errors, this.warnings);
    this.coverageChecker = new CoverageChecker(this.specsDir);
    this.duplicateChecker = new DuplicateChecker(this.errors, this.warnings);
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`配置文件不存在: ${this.configPath}`);
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  /**
   * 运行所有验证
   */
  run() {
    console.log('🚀 开始验证 OpenAPI 规范...\n');

    try {
      // 验证模块文件
      this.moduleValidator.validateModules(this.config, this.specsDir);

      // 检查接口覆盖率
      this.coverageChecker.checkApiCoverage(this.config);

      // 检查重复定义
      this.duplicateChecker.checkDuplicates(this.config, this.specsDir);

      // 输出结果
      console.log('\n📋 验证结果:');

      if (this.errors.length > 0) {
        console.log('\n❌ 错误:');
        this.errors.forEach((error) => console.log(`   - ${error}`));
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️  警告:');
        this.warnings.forEach((warning) => console.log(`   - ${warning}`));
      }

      if (this.errors.length === 0 && this.warnings.length === 0) {
        console.log('   ✅ All validations passed successfully!');
      }

      console.log(
        `\n📊 统计: ${this.errors.length} 个错误, ${this.warnings.length} 个警告`,
      );

      // 如果有错误，退出码为 1
      if (this.errors.length > 0) {
        throw new Error('Validation failed');
      }
    } catch (error) {
      console.error('\n❌ 验证失败:', error.message);
      throw error;
    }
  }
}

module.exports = SpecValidator;
