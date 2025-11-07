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
 * 类型转换工具
 */
class TypeConverter {
  /**
   * 确定参数类型（降低嵌套层级）
   */
  static determineParameterType(type) {
    if (type.includes('Body') || type.includes('Request')) {
      return 'body';
    }
    if (type.includes('Path') || type.includes('PydanticObjectId')) {
      // PydanticObjectId通常用作路径参数（如MongoDB的ObjectId）
      return 'path';
    }
    return 'query';
  }

  /**
   * Python类型转换为OpenAPI类型
   */
  static pythonTypeToOpenAPI(pythonType) {
    const typeMap = {
      str: { type: 'string' },
      int: { type: 'integer' },
      float: { type: 'number' },
      bool: { type: 'boolean' },
      'List[str]': { type: 'array', items: { type: 'string' } },
      'List[int]': { type: 'array', items: { type: 'integer' } },
      'Dict[str, Any]': { type: 'object' },
      'Optional[str]': { type: 'string' },
      'Optional[int]': { type: 'integer' },
      datetime: { type: 'string', format: 'date-time' },
      // 添加常见的复杂类型
      PydanticObjectId: { type: 'string', description: 'MongoDB ObjectId' },
      SecretStr: { type: 'string', description: 'Secret string' },
      DatasourceType: {
        type: 'string',
        enum: ['volcengine', 'aliyun', 'zabbix'],
      },
      IntelligentThresholdTaskStatus: {
        type: 'string',
        enum: ['Running', 'Stopped', 'Failed', 'Pending'],
      },
    };

    // 处理Optional类型
    if (pythonType.startsWith('Optional[')) {
      const innerType = pythonType.slice(9, -1);
      return TypeConverter.pythonTypeToOpenAPI(innerType);
    }

    // 处理List类型
    if (pythonType.startsWith('List[')) {
      const innerType = pythonType.slice(5, -1);
      return {
        type: 'array',
        items: TypeConverter.pythonTypeToOpenAPI(innerType),
      };
    }

    // 处理复杂对象类型（如果不在typeMap中，假设是自定义对象）
    if (
      pythonType &&
      !typeMap[pythonType] &&
      pythonType.match(/^[A-Z][a-zA-Z0-9]*$/)
    ) {
      return {
        type: 'object',
        description: `Reference to ${pythonType} object`,
        // 可以添加 $ref 引用，但这里先简化处理
        additionalProperties: true,
      };
    }

    return typeMap[pythonType] || { type: 'string' };
  }

  /**
   * 提取模型字段
   */
  static extractModelFields(body, pythonTypeToOpenAPIFn) {
    const fields = [];

    // 匹配字段定义
    const fieldPattern = /(\w+)\s*:\s*([^=\n]+)(?:\s*=\s*([^\n]+))?/g;

    let match = fieldPattern.exec(body);
    while (match !== null) {
      const [, name, type, defaultValue] = match;

      if (name && !name.startsWith('_')) {
        // 判断是否必填：Field(...) 表示必填，Field(None) 或 Optional 表示可选
        let required = false;
        if (defaultValue) {
          // 检查是否是 Field(...) 必填标记
          if (
            defaultValue.includes('Field(...)') ||
            defaultValue.includes('Field(...,')
          ) {
            required = true;
          }
          // 检查是否是 Optional 类型或有默认值
          else if (
            type.includes('Optional') ||
            defaultValue.includes('None') ||
            defaultValue.includes('Field(None')
          ) {
            required = false;
          }
          // 其他有默认值的情况
          else {
            required = false;
          }
        } else {
          // 没有默认值，检查类型是否为Optional
          required = !type.includes('Optional');
        }

        fields.push({
          name: name.trim(),
          type: pythonTypeToOpenAPIFn(type.trim()),
          required,
          description: `Field: ${name}`,
        });
      }
      match = fieldPattern.exec(body);
    }

    return fields;
  }

  /**
   * 改进的枚举识别方法
   * 正确区分Pydantic字段定义和真正的枚举值
   */
  static isEnumBody(body) {
    const lines = body.split('\n');
    let enumCount = 0;
    let fieldCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过空行、注释和配置行
      if (
        !trimmedLine ||
        trimmedLine.startsWith('#') ||
        trimmedLine.startsWith('class Config:')
      ) {
        continue;
      }

      // 跳过Pydantic Field定义和类型注解
      if (
        trimmedLine.includes('Field(') ||
        trimmedLine.includes(': ') ||
        trimmedLine.includes('Optional[')
      ) {
        fieldCount++;
        continue;
      }

      // 只识别真正的枚举模式: 变量名 = "值"
      if (trimmedLine.match(/^\s*[A-Z_][A-Z0-9_]*\s*=\s*["'][^"']+["']\s*$/)) {
        enumCount++;
      }
    }

    // 如果有Field定义，说明是Pydantic模型而不是枚举
    if (fieldCount > 0) {
      return false;
    }

    // 只有当有真正的枚举值定义时才认为是枚举
    return enumCount > 0;
  }
}

module.exports = { TypeConverter };
