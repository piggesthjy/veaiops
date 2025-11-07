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

// 注意：TypeConverter 未使用，已移除导入
// const { TypeConverter } = require('./type-converter');

/**
 * OpenAPI 规范生成器
 */
class OpenAPIGenerator {
  /**
   * 生成完整的OpenAPI规范
   */
  static generateOpenAPISpec(
    config,
    routers,
    apiConfig,
    pythonTypeToOpenAPIFn,
  ) {
    console.log('🚀 基于Python代码生成OpenAPI规范...');

    const paths = {};
    const schemas = {
      // 首先添加配置文件中的schemas
      ...(apiConfig.schemas || {}),
    };

    // 处理每个路由器
    for (const router of routers) {
      for (const endpoint of router.endpoints) {
        // 修复路径重复问题：如果prefix已经包含/apis/v1，则不重复添加
        let fullPath;
        if (router.prefix.startsWith('/apis/v1')) {
          fullPath = `${router.prefix}${endpoint.path}`;
        } else {
          fullPath = `/apis/v1${router.prefix}${endpoint.path}`;
        }

        if (!paths[fullPath]) {
          paths[fullPath] = {};
        }

        // 生成路径参数和查询参数
        const parameters = OpenAPIGenerator.generatePathParameters(
          endpoint.path,
          endpoint,
          pythonTypeToOpenAPIFn,
        );

        // 生成请求体
        const requestBody = OpenAPIGenerator.generateRequestBody(
          endpoint,
          pythonTypeToOpenAPIFn,
        );

        // 生成响应
        const responses = OpenAPIGenerator.generateResponses();

        paths[fullPath][endpoint.method.toLowerCase()] = {
          summary: `${endpoint.method} ${fullPath}`,
          description: endpoint.description,
          tags: router.tags,
          parameters,
          ...(requestBody && { requestBody }),
          responses,
        };
      }

      // 添加模型到schemas
      for (const model of router.models) {
        schemas[model.name] = OpenAPIGenerator.generateModelSchema(model);
      }
    }

    // 添加基础响应模型
    schemas.APIResponse = {
      type: 'object',
      properties: {
        code: { type: 'integer', description: '响应状态码' },
        message: { type: 'string', description: '响应消息' },
        data: { description: '响应数据' },
      },
      required: ['code', 'message'],
    };

    return {
      openapi: '3.0.0',
      info: {
        title: config.title,
        version: config.version,
        description: `${config.description} (Python Code Analysis)`,
      },
      servers: [{ url: '/', description: 'Current server' }],
      paths,
      components: { schemas },
    };
  }

  /**
   * 生成路径参数和查询参数
   */
  static generatePathParameters(path, endpoint, pythonTypeToOpenAPIFn) {
    const parameters = [];
    const pathParamNames = new Set(); // 用于跟踪路径参数名称

    // 1. 处理路径参数
    const pathParamMatches = path.match(/\{([^}]+)\}/g);
    if (pathParamMatches) {
      for (const match of pathParamMatches) {
        const paramName = match.slice(1, -1);
        pathParamNames.add(paramName); // 记录路径参数名称
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `Path parameter: ${paramName}`,
        });
      }
    }

    // 2. 处理查询参数（从函数参数中提取，避免与路径参数重复）
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (param.paramType === 'query') {
          // 智能去重：如果参数名已经作为路径参数存在，则跳过
          if (pathParamNames.has(param.name)) {
            console.log(`⚠️  跳过重复参数: ${param.name} (已作为路径参数存在)`);
            continue;
          }

          parameters.push({
            name: param.name,
            in: 'query',
            required: param.required,
            schema: pythonTypeToOpenAPIFn(param.type),
            description: `Query parameter: ${param.name}`,
          });
        }
        // Body参数不在parameters中处理，而是在requestBody中处理
      }
    }

    return parameters;
  }

  /**
   * 生成请求体
   */
  static generateRequestBody(endpoint, pythonTypeToOpenAPIFn) {
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      // 查找Body参数
      const bodyParam = endpoint.parameters?.find(
        (param) => param.paramType === 'body',
      );

      return {
        required: true, // 假定Body参数是必须的
        content: {
          'application/json': {
            schema: {
              // 如果找到了Body参数，使用其类型作为请求体模式
              ...(bodyParam && pythonTypeToOpenAPIFn(bodyParam.type)),
              // 如果没有找到Body参数，则为通用对象
              ...(!bodyParam && {
                type: 'object',
                description: `Request body for ${endpoint.functionName}`,
              }),
            },
          },
        },
      };
    }
    return null;
  }

  /**
   * 生成响应
   */
  static generateResponses() {
    return {
      200: {
        description: 'Successful Response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/APIResponse',
            },
          },
        },
      },
      400: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/APIResponse',
            },
          },
        },
      },
    };
  }

  /**
   * 生成模型Schema
   */
  static generateModelSchema(model) {
    const properties = {};
    const required = [];

    for (const field of model.fields) {
      properties[field.name] = {
        ...field.type,
        description: field.description,
      };

      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      type: 'object',
      description: model.description,
      properties,
      ...(required.length > 0 && { required }),
    };
  }
}

module.exports = { OpenAPIGenerator };
