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

const { TypeConverter } = require('./type-converter');

/**
 * Python 代码解析器
 */
class CodeParser {
  /**
   * 提取路由器前缀
   */
  static extractRouterPrefix(content, relativePath) {
    // 尝试从APIRouter定义中提取prefix
    const routerPattern = /APIRouter\s*\(\s*prefix\s*=\s*["']([^"']+)["']/;
    const match = content.match(routerPattern);

    if (match) {
      return match[1];
    }

    // 根据文件路径推断前缀
    const pathParts = relativePath.split('/');
    if (pathParts.length > 1) {
      return `/${pathParts.slice(0, -1).join('/')}`;
    }

    // 根据文件名推断
    const fileName = require('path').basename(relativePath, '.py');
    return `/${fileName.replace('_', '-')}`;
  }

  /**
   * 提取标签
   */
  static extractTags(content, relativePath) {
    // 尝试从APIRouter定义中提取tags
    const tagsPattern = /APIRouter\s*\([^)]*tags\s*=\s*\[([^\]]+)\]/;
    const match = content.match(tagsPattern);

    if (match) {
      return match[1].split(',').map((tag) => tag.trim().replace(/["']/g, ''));
    }

    // 根据文件名生成标签
    const fileName = require('path').basename(relativePath, '.py');
    return [
      fileName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    ];
  }

  /**
   * 提取端点
   */
  static extractEndpoints(
    content,
    extractFunctionDocstringFn,
    extractFunctionParametersFn,
  ) {
    const endpoints = [];

    // 匹配路由装饰器和函数定义
    const routePattern =
      /@router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["'][^)]*\)\s*\n\s*async\s+def\s+(\w+)\s*\([^)]*\)/g;

    let match = routePattern.exec(content);
    while (match !== null) {
      const [, method, path, functionName] = match;

      const endpoint = {
        method: method.toUpperCase(),
        path,
        functionName,
        description: extractFunctionDocstringFn(content, functionName),
        parameters: extractFunctionParametersFn(content, functionName),
      };

      endpoints.push(endpoint);
      match = routePattern.exec(content);
    }

    return endpoints;
  }

  /**
   * 提取函数参数
   */
  static extractFunctionParameters(content, functionName, parseParameterFn) {
    const parameters = [];

    // 匹配函数定义和参数
    const funcPattern = new RegExp(
      `async\\s+def\\s+${functionName}\\s*\\(([^)]*)\\)`,
      's',
    );
    const match = content.match(funcPattern);

    if (match) {
      const paramString = match[1];
      const paramMatches = paramString.match(
        /(\w+)\s*:\s*([^,=]+)(?:\s*=\s*([^,]+))?/g,
      );

      if (paramMatches) {
        for (const paramMatch of paramMatches) {
          const param = parseParameterFn(paramMatch);
          if (param) {
            parameters.push(param);
          }
        }
      }
    }

    return parameters;
  }

  /**
   * 解析单个参数
   */
  static parseParameter(paramMatch) {
    const paramParts = paramMatch.match(
      /(\w+)\s*:\s*([^,=]+)(?:\s*=\s*([^,]+))?/,
    );
    if (!paramParts) {
      return null;
    }

    const [, name, type, defaultValue] = paramParts;

    // 跳过特殊参数
    if (name === 'self' || name === 'cls') {
      return null;
    }

    // 改进参数类型判断逻辑（降低嵌套层级）
    const paramType = TypeConverter.determineParameterType(type);

    return {
      name: name.trim(),
      type: type.trim(),
      paramType,
      required: !defaultValue,
      defaultValue: defaultValue?.trim(),
    };
  }

  /**
   * 提取函数文档字符串
   */
  static extractFunctionDocstring(content, functionName) {
    const funcPattern = new RegExp(
      `async\\s+def\\s+${functionName}\\s*\\([^)]*\\)\\s*->\\s*[^:]+:\\s*"""([^"]+)"""`,
      's',
    );
    const match = content.match(funcPattern);

    if (match) {
      return match[1].trim().split('\n')[0]; // 取第一行作为描述
    }

    return `Auto-generated endpoint: ${functionName}`;
  }

  /**
   * 提取模型定义
   */
  static extractModels(content, extractModelFieldsFn) {
    const models = [];

    // 匹配Pydantic模型定义
    const modelPattern =
      /class\s+(\w+)\s*\(\s*BaseModel\s*\)\s*:\s*"""([^"]+)"""([\s\S]*?)(?=\n\s*class|\n\s*@|\n\s*def|\n\s*$)/g;

    let match = modelPattern.exec(content);
    while (match !== null) {
      const [, className, description, body] = match;

      const model = {
        name: className,
        description: description.trim(),
        fields: extractModelFieldsFn(body),
      };

      models.push(model);
      match = modelPattern.exec(content);
    }

    return models;
  }
}

module.exports = { CodeParser };
