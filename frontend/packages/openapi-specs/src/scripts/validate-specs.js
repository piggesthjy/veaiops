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
 * OpenAPI 规范验证脚本入口文件（向后兼容）
 *
 * 原文件已拆分为多个模块：
 * - validate-specs/module-validator.js: 模块验证
 * - validate-specs/coverage-checker.js: 接口覆盖率检查
 * - validate-specs/duplicate-checker.js: 重复定义检查
 * - validate-specs/validator.js: 主验证器类
 * - validate-specs/index.js: 导出入口
 */

// 重新导出拆分后的模块（保持向后兼容）
const SpecValidator = require('./validate-specs/index.js');

// 如果直接运行此脚本
if (require.main === module) {
  const validator = new SpecValidator();
  validator.run();
}

module.exports = SpecValidator;
