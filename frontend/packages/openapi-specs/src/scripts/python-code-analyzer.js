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
 * Python代码分析器入口文件（向后兼容）
 *
 * 原文件已拆分为多个模块：
 * - python-code-analyzer/file-utils.js: 文件工具函数
 * - python-code-analyzer/code-parser.js: Python 代码解析
 * - python-code-analyzer/type-converter.js: 类型转换
 * - python-code-analyzer/openapi-generator.js: OpenAPI 规范生成
 * - python-code-analyzer/analyzer.js: 主分析器类
 * - python-code-analyzer/index.js: 导出入口
 */

// 重新导出拆分后的模块（保持向后兼容）
const { PythonCodeAnalyzer } = require('./python-code-analyzer/index.js');

module.exports = { PythonCodeAnalyzer };
